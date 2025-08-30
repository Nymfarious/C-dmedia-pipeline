import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Replicate from "https://esm.sh/replicate@0.25.2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Working Replicate model configurations
const MODEL_CONFIG = {
  'nano-banana': 'google/nano-banana',
  'background-remove': 'cjwbw/rembg',
  'flux-inpaint': 'black-forest-labs/flux-fill-dev',
  'flux-inpaint-pro': 'black-forest-labs/flux-fill-pro',
  'upscale': 'nightmareai/real-esrgan',
  'birefnet': 'men1scus/birefnet', // Better background removal
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to ensure URL is public and accessible
async function ensurePublicUrl(url: string, bucket: string = 'ai-images'): Promise<string> {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) {
    throw new Error('Invalid or inaccessible image URL. Please ensure image is publicly accessible.');
  }
  
  // Test if URL is accessible
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error(`Image URL not accessible: ${response.status}`);
    }
    return url;
  } catch (error) {
    throw new Error(`Failed to access image URL: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN')
    if (!REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not set')
    }

    const replicate = new Replicate({ auth: REPLICATE_API_TOKEN })
    const body = await req.json()
    console.log("Enhanced Replicate request:", JSON.stringify(body, null, 2))

    // Validate required fields
    if (!body.operation || !body.input) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: operation and input are required" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Ensure image URLs are publicly accessible
    if (body.input.image) {
      body.input.image = await ensurePublicUrl(body.input.image);
    }
    if (body.input.mask) {
      body.input.mask = await ensurePublicUrl(body.input.mask, 'ai-masks');
    }
    if (body.input.images) {
      for (let i = 0; i < body.input.images.length; i++) {
        body.input.images[i] = await ensurePublicUrl(body.input.images[i]);
      }
    }

    let output;
    let modelKey = body.operation;
    
    console.log(`Running operation: ${body.operation}`)

    switch (body.operation) {
      case 'nano-banana-edit':
        modelKey = 'nano-banana';
        if (body.input.images && body.input.images.length > 1) {
          // Multi-image fusion
          output = await replicate.run(MODEL_CONFIG[modelKey], {
            input: {
              images: body.input.images,
              prompt: body.input.instruction || body.input.prompt || 'Seamlessly combine these images',
              negative_prompt: body.input.negative_prompt || "blurred, distorted, artifacts, low quality",
              guidance_scale: body.input.guidance_scale || 7.5,
              num_inference_steps: body.input.num_inference_steps || 20,
              strength: body.input.strength || 0.8
            }
          });
        } else {
          // Single image editing with instruction-based editing
          output = await replicate.run(MODEL_CONFIG[modelKey], {
            input: {
              input_image: body.input.image, // Note: nano-banana uses input_image, not image
              prompt: body.input.instruction || body.input.prompt || 'Edit this image',
              negative_prompt: body.input.negative_prompt || "blurred, distorted, artifacts, low quality",
              guidance_scale: body.input.guidance_scale || 7.5,
              num_inference_steps: body.input.num_inference_steps || 20,
              strength: body.input.strength || 0.8,
              ...(body.input.mask && { mask: body.input.mask })
            }
          });
        }
        break;

      case 'background-removal':
        modelKey = 'birefnet'; // Use better background removal model
        output = await replicate.run(MODEL_CONFIG[modelKey], {
          input: { 
            image: body.input.image,
            model: 'general-use',
            refine_foreground: true
          }
        });
        break;

      case 'flux-inpaint':
        modelKey = 'flux-inpaint';
        if (!body.input.mask) {
          throw new Error('Mask required for inpainting operation');
        }
        output = await replicate.run(MODEL_CONFIG[modelKey], {
          input: {
            image: body.input.image,
            mask: body.input.mask,
            prompt: body.input.prompt || body.input.instruction || 'Inpaint the masked area',
            guidance_scale: body.input.guidance_scale || 3.5,
            num_inference_steps: body.input.num_inference_steps || 28,
            strength: body.input.strength || 0.8,
            seed: body.input.seed
          }
        });
        break;

      case 'professional-upscale':
        modelKey = 'upscale';
        output = await replicate.run(MODEL_CONFIG[modelKey], {
          input: {
            image: body.input.image,
            scale: body.input.scale || 4,
            face_enhance: body.input.face_enhance !== false
          }
        });
        break;

      case 'multi-image-fusion':
        modelKey = 'nano-banana';
        if (!body.input.images || body.input.images.length < 2) {
          throw new Error('At least 2 images required for fusion');
        }
        output = await replicate.run(MODEL_CONFIG[modelKey], {
          input: {
            images: body.input.images,
            prompt: body.input.instruction || body.input.prompt || 'Seamlessly combine these images into one cohesive artwork',
            negative_prompt: body.input.negative_prompt || "blurred, distorted, artifacts, low quality, separated images",
            guidance_scale: body.input.guidance_scale || 7.5,
            num_inference_steps: body.input.num_inference_steps || 25,
            strength: body.input.strength || 0.8
          }
        });
        break;

      default:
        throw new Error(`Unknown operation: ${body.operation}`);
    }

    console.log("Generation response:", output)

    // Extract the final image URL from output
    let imageUrl = output;
    if (Array.isArray(output) && output.length > 0) {
      imageUrl = output[0];
    }

    if (typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      throw new Error('No image content found in response');
    }

    return new Response(JSON.stringify({ output: imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in replicate-enhanced function:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})