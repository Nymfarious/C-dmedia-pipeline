import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Replicate from "https://esm.sh/replicate@0.25.2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Model configuration
const MODEL_CONFIG = {
  // Image Generation
  'flux-schnell': 'black-forest-labs/flux-schnell',
  'flux-dev': 'black-forest-labs/flux.1-dev',
  'stable-diffusion': 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
  
  // Image Editing
  'nano-banana': 'google/nano-banana',
  'seed-edit': 'seedlabs/seededit-3.0:e8c3a0f6f8b0b3f4e3a0f6f8b0b3f4e3',
  'background-remove': 'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
  'upscale': 'tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3',
  'object-remove': 'andreasjansson/remove-object:ee05b83ade94cd0e11628243fb5c043fffe64d2e3b32f3afe83b6aec8b50a7ab',
  
  // Multi-modal
  'flux-inpaint': 'black-forest-labs/flux.1-dev-inpainting',
  'controlnet': 'jagilley/controlnet-depth-v1:34a7f2d4a1d1c21f84b69aaf68fe8f4f7bcfccc2ab2fdb6b1f4c5b5d1e2e3f4g',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN')
    if (!REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not set')
    }

    const replicate = new Replicate({ auth: REPLICATE_API_TOKEN })
    const body = await req.json()
    console.log("Enhanced Replicate request:", JSON.stringify(body, null, 2))

    // Validate input
    if (!body.operation) {
      return new Response(JSON.stringify({ error: 'Operation type required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create operation tracking record with authenticated user
    const operationId = crypto.randomUUID()
    const { error: insertError } = await supabase
      .from('ai_operations')
      .insert({
        id: operationId,
        operation_type: body.operation,
        provider: 'replicate',
        model: body.model || body.operation,
        input_params: body.input,
        user_id: user.id,
        status: 'pending'
      })

    if (insertError) {
      console.error('Failed to create operation record:', insertError)
    }

    // Handle prediction status checks
    if (body.predictionId) {
      console.log("Checking status for prediction:", body.predictionId)
      const prediction = await replicate.predictions.get(body.predictionId)
      
      // Update operation status
      if (!insertError) {
        await supabase
          .from('ai_operations')
          .update({
            status: prediction.status,
            job_id: body.predictionId,
            ...(prediction.error && { error_message: prediction.error }),
            ...(prediction.status === 'succeeded' && { completed_at: new Date().toISOString() })
          })
          .eq('id', operationId)
      }

      return new Response(JSON.stringify(prediction), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate required fields
    if (!body.operation || !body.input) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: operation and input are required" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let output;
    const model = MODEL_CONFIG[body.model] || body.model;
    
    console.log(`Running operation: ${body.operation} with model: ${model}`)

    switch (body.operation) {
      case 'generate':
        output = await replicate.run(model, {
          input: {
            prompt: body.input.prompt,
            num_outputs: body.input.num_outputs || 1,
            aspect_ratio: body.input.aspect_ratio || "1:1",
            output_format: body.input.output_format || "webp",
            output_quality: body.input.output_quality || 80,
            ...body.input
          }
        });
        break;

      case 'nano-banana-edit':
        output = await replicate.run(MODEL_CONFIG['nano-banana'], {
          input: {
            image: body.input.image,
            instruction: body.input.instruction,
            negative_prompt: body.input.negative_prompt || "blurred, distorted, artifacts, low quality",
            guidance_scale: body.input.guidance_scale || 7.5,
            num_inference_steps: body.input.num_inference_steps || 20,
            strength: body.input.strength || 0.8
          }
        });
        break;

      case 'seed-edit':
        output = await replicate.run(MODEL_CONFIG['seed-edit'], {
          input: {
            image: body.input.image,
            instruction: body.input.instruction,
            ...(body.input.mask && { mask: body.input.mask }),
            strength: body.input.strength || 0.8,
            guidance_scale: body.input.guidance_scale || 7.5
          }
        });
        break;

      case 'flux-inpaint':
        output = await replicate.run(MODEL_CONFIG['flux-inpaint'], {
          input: {
            image: body.input.image,
            mask: body.input.mask,
            prompt: body.input.prompt,
            negative_prompt: body.input.negative_prompt || "blurred, distorted, artifacts",
            guidance_scale: body.input.guidance_scale || 3.5,
            num_inference_steps: body.input.num_inference_steps || 28,
            strength: body.input.strength || 0.8
          }
        });
        break;

      case 'background-removal':
        output = await replicate.run(MODEL_CONFIG['background-remove'], {
          input: { image: body.input.image }
        });
        break;

      case 'upscale':
        output = await replicate.run(MODEL_CONFIG['upscale'], {
          input: {
            img: body.input.image,
            version: "v1.4",
            scale: body.input.scale || 2
          }
        });
        break;

      case 'object-removal':
        output = await replicate.run(MODEL_CONFIG['object-remove'], {
          input: {
            image: body.input.image,
            mask_instruction: body.input.mask_instruction || body.input.instruction,
            mask: body.input.mask
          }
        });
        break;

      case 'object-addition':
      case 'add-object':
        output = await replicate.run(MODEL_CONFIG['flux-dev'], {
          input: {
            image: body.input.image,
            mask: body.input.mask,
            prompt: body.input.prompt,
            negative_prompt: body.input.negative_prompt || "blurred, distorted, artifacts",
            guidance_scale: body.input.guidance_scale || 3.5,
            num_inference_steps: body.input.num_inference_steps || 28,
            strength: body.input.strength || 0.8
          }
        });
        break;

      case 'color-enhance':
        output = await replicate.run(MODEL_CONFIG['nano-banana'], {
          input: {
            image: body.input.image,
            instruction: body.input.instruction || "Enhance colors and improve image quality",
            negative_prompt: body.input.negative_prompt || "blurred, distorted, artifacts",
            guidance_scale: 7.5,
            num_inference_steps: 20,
            strength: 0.6
          }
        });
        break;

      default:
        // Fallback to direct model execution
        output = await replicate.run(model, { input: body.input });
    }

    console.log("Generation response:", output)

    // Store result in Supabase Storage if it's an image URL
    let finalOutput = output;
    if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
      const imageUrl = output[0];
      try {
        // Download and store the image
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.blob();
        const fileName = `${operationId}-${Date.now()}.webp`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('ai-images')
          .upload(fileName, imageBlob, {
            contentType: 'image/webp',
            cacheControl: '3600'
          });

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('ai-images')
            .getPublicUrl(fileName);
          
          finalOutput = [publicUrl];
          
          // Update operation with final URL
          if (!insertError) {
            await supabase
              .from('ai_operations')
              .update({
                output_asset_url: publicUrl,
                status: 'succeeded',
                completed_at: new Date().toISOString()
              })
              .eq('id', operationId);
          }
        }
      } catch (storageError) {
        console.error('Storage upload failed:', storageError);
        // Continue with original URL if storage fails
      }
    }

    return new Response(JSON.stringify({ output: finalOutput }), {
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