import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

/**
 * Persist image to Supabase storage
 */
async function persistToSupabase(dataUrl: string, fileName: string): Promise<{ publicUrl: string }> {
  console.log('💾 Persisting image to Supabase storage:', fileName);
  
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  
  const filePath = `edits/${fileName}`;
  
  // Upload to Supabase storage
  const { data, error } = await supabase.storage
    .from('ai-images')
    .upload(filePath, blob, {
      contentType: blob.type || 'image/webp',
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('❌ Storage upload failed:', error);
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('ai-images')
    .getPublicUrl(filePath);

  console.log('✅ Image persisted to storage:', publicUrl);
  return { publicUrl };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { prompt, model = 'gpt-image-1', size = '1024x1024', quality = 'high', output_format = 'webp', background = 'transparent' } = await req.json();

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size,
        quality,
        output_format,
        background
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error?.message || 'Image generation failed');
    }

    // OpenAI returns base64 for gpt-image-1
    const imageData = data.data[0];
    const imageUrl = imageData.b64_json ? `data:image/${output_format};base64,${imageData.b64_json}` : imageData.url;
    
    // Persist to Supabase storage to prevent temporary URL issues
    const timestamp = Date.now();
    const fileName = `openai-${model}-${timestamp}.${output_format}`;
    const persisted = await persistToSupabase(imageUrl, fileName);
    
    return new Response(JSON.stringify({ 
      image: persisted.publicUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in openai-image function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});