import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeminiEditRequest {
  imageUrl: string;
  instruction: string;
  model?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, instruction, model = 'gemini-2.5-flash-image' }: GeminiEditRequest = await req.json();
    
    console.log('Gemini Edit Request:', { imageUrl: imageUrl.slice(0, 100) + '...', instruction, model });

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Fetch the source image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    console.log('Image fetched and converted to base64, size:', base64Image.length);

    // Prepare Gemini API request
    const geminiRequest = {
      contents: [{
        parts: [
          {
            text: `Edit this image: ${instruction}. Maintain high quality and natural appearance. Return only the edited image.`
          },
          {
            inlineData: {
              mimeType,
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API request failed: ${response.statusText}`);
    }

    const geminiResult = await response.json();
    console.log('Gemini response received');

    // Extract the image from the response
    const candidate = geminiResult.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
    
    if (!imagePart?.inlineData?.data) {
      console.error('No image data in Gemini response:', geminiResult);
      throw new Error('No edited image received from Gemini');
    }

    // Convert base64 back to blob URL for client
    const editedImageData = imagePart.inlineData.data;
    const editedMimeType = imagePart.inlineData.mimeType;
    
    // Create a data URL that can be used by the client
    const dataUrl = `data:${editedMimeType};base64,${editedImageData}`;

    const asset = {
      id: crypto.randomUUID(),
      type: 'image',
      name: `Gemini Edit: ${instruction.slice(0, 30)}...`,
      src: dataUrl,
      meta: {
        provider: 'gemini.nano',
        model,
        instruction,
        editedAt: Date.now(),
        width: 1024, // Gemini typically returns 1024x1024
        height: 1024
      },
      createdAt: Date.now(),
    };

    console.log('Gemini edit completed successfully');

    return new Response(JSON.stringify({ 
      ok: true, 
      asset 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-edit function:', error);
    
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});