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
      contentType: blob.type || 'image/png',
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
    const huggingfaceToken = Deno.env.get('HUGGINGFACE_TOKEN');
    if (!huggingfaceToken) {
      throw new Error('HUGGINGFACE_TOKEN is not configured');
    }

    const { prompt, negative_prompt = "", model = 'black-forest-labs/FLUX.1-schnell' } = await req.json();

    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${huggingfaceToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          negative_prompt,
          num_inference_steps: 4,
          guidance_scale: 1.0,
          width: 1024,
          height: 1024
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    // HuggingFace returns image as blob
    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const dataUrl = `data:image/png;base64,${base64}`;

    // Persist to Supabase storage to prevent data URL issues
    const timestamp = Date.now();
    const fileName = `hf-flux-${timestamp}.png`;
    const persisted = await persistToSupabase(dataUrl, fileName);

    return new Response(JSON.stringify({ 
      image: persisted.publicUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in huggingface-image function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});