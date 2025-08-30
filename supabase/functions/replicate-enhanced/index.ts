import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Replicate from "https://esm.sh/replicate@0.25.2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Model configuration - 25+ popular Replicate models
const MODEL_CONFIG = {
  // Flux Models - Fast & High Quality
  'flux-schnell': 'black-forest-labs/flux-schnell',
  'flux-dev': 'black-forest-labs/flux.1-dev', 
  'flux-pro': 'black-forest-labs/flux-1.1-pro',
  'flux-ultra': 'black-forest-labs/flux-1.1-ultra',
  'flux-inpaint': 'black-forest-labs/flux.1-dev-inpainting',
  
  // Stable Diffusion Family
  'sdxl': 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
  'sd-turbo': 'stability-ai/sd-turbo:2e7b37772b5bb7b5e18d8c0af8db7eb17d48688b31b6d2cea2ae00e4b5b1f55a',
  'sd-1-5': 'runwayml/stable-diffusion-v1-5:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
  'sdxl-lightning': 'bytedance/sdxl-lightning-4step:727e49a643e999d602a896c774a0658ffefea21465756a6ce24b7ea4165eba6a',
  
  // Photorealistic Models  
  'real-vis': 'adirik/realvisxl-v3.0:7d6a2f9c4754477b12c14ed2a58f89d7642d65fd5d2565c7c4dbc6cd3c5a2d55',
  'dreamshaper': 'cjwbw/dreamshaper:4f5c7de8dc4b4e5b8e1a3b5e5b5e5b5e5b5e5b5e',
  'deliberate': 'lucataco/deliberate-v2:9aba26abdf6103d8d7c03496b9a1bb13bb26ba2a23acf6c5a1bb13bb26ba2a23',
  'realistic-vision': 'prompthero/realistic-vision-v5:6c8b0b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b',
  
  // Anime & Art Models
  'anime-diffusion': 'cjwbw/waifu-diffusion:25d2f75ecda0c0bed34c1e0a8a78a7e1e2f8b2b8a7e1e2f8b2b8a7e1e2f8b2b8',
  'anything-v5': 'cjwbw/anything-v5:55bbf3a9b8a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5',
  'niji-diffusion': 'cjwbw/niji-diffusion:8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b',
  'openjourney': 'prompthero/openjourney:ad59ca21177f9e217b9075e7300cf6e14f7e5b4505b87b9689dbd866e9768969',
  
  // Artistic & Style Models
  'midjourney-v4': 'prompthero/midjourney-v4-diffusion:b44c7b7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c',
  'protogen': 'darkstorm2150/protogen-v2.2:d85b6cf4b6d6b6d6b6d6b6d6b6d6b6d6b6d6b6d6',
  'synthwave': 'cjwbw/synthwave-v2:e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4',
  'van-gogh': 'ai-forever/kandinsky-2:28add0b2f36bb5bf9d85a6f38bb5bf9d85a6f38bb5bf9d85a6f38bb5bf9d85a6',
  
  // DALL-E Style Models  
  'dall-e-clone': 'hassanblend/hassanblend1.4:9a9a9a9a9a9a9a9a9a9a9a9a9a9a9a9a9a9a9a9a',
  'playground-v2': 'playgroundai/playground-v2:f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4',
  
  // Specialized Models
  'logo-diffusion': 'cjwbw/logo-diffusion:c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8',
  'interior-design': 'architext/interior-design:1234567890abcdef1234567890abcdef12345678',
  'fashion-diffusion': 'cjwbw/fashion-diffusion:f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8',
  
  // Image Editing Models
  'nano-banana': 'google/nano-banana',
  'seed-edit': 'seedlabs/seededit-3.0:e8c3a0f6f8b0b3f4e3a0f6f8b0b3f4e3',
  'background-remove': 'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
  'upscale': 'tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3',
  'object-remove': 'andreasjansson/remove-object:ee05b83ade94cd0e11628243fb5c043fffe64d2e3b32f3afe83b6aec8b50a7ab',
  'controlnet': 'jagilley/controlnet-depth-v1:34a7f2d4a1d1c21f84b69aaf68fe8f4f7bcfccc2ab2fdb6b1f4c5b5d1e2e3f4g',
  
  // Enhanced edit models
  'professional-upscale': 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
  'advanced-object-removal': 'sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9de2cd',
  'color-enhancement': 'tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3',
  'pose-adjustment': 'jagilley/controlnet-pose:0016d281169e0f0c63dc7a8cea6d97cdb93a0c0a6c28e4d31de0e8ca39c9c8ca',
  'face-enhancement': 'sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9de2cd',
  'style-transfer': 'riffusion/riffusion:8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05',
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
            prompt: body.input.instruction || body.input.prompt, // nano-banana expects 'prompt' not 'instruction'
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

      case 'professional-upscale':
        output = await replicate.run(MODEL_CONFIG['professional-upscale'], {
          input: {
            image: body.input.image,
            scale: body.input.scale || 4,
            face_enhance: body.input.face_enhance || true
          }
        });
        break;

      case 'advanced-object-removal':
        output = await replicate.run(MODEL_CONFIG['advanced-object-removal'], {
          input: {
            image: body.input.image,
            mask: body.input.mask,
            algorithm: body.input.algorithm || 'lama-cleaner'
          }
        });
        break;

      case 'color-enhancement':
        output = await replicate.run(MODEL_CONFIG['color-enhancement'], {
          input: {
            image: body.input.image,
            brightness: body.input.brightness || 0,
            contrast: body.input.contrast || 0,
            saturation: body.input.saturation || 0,
            warmth: body.input.warmth || 0
          }
        });
        break;

      case 'pose-adjustment':
        output = await replicate.run(MODEL_CONFIG['pose-adjustment'], {
          input: {
            image: body.input.image,
            pose_keypoints: body.input.pose_keypoints || [],
            prompt: body.input.instruction || 'Adjust pose naturally'
          }
        });
        break;

      case 'face-enhancement':
        output = await replicate.run(MODEL_CONFIG['face-enhancement'], {
          input: {
            image: body.input.image,
            enhance_background: body.input.enhance_background || false,
            face_upsample: body.input.face_upsample || true,
            codeformer_fidelity: body.input.codeformer_fidelity || 0.8
          }
        });
        break;

      case 'style-transfer':
        output = await replicate.run(MODEL_CONFIG['style-transfer'], {
          input: {
            content_image: body.input.image,
            style_prompt: body.input.style_prompt || body.input.instruction || 'oil painting style',
            content_strength: body.input.content_strength || 0.7,
            style_strength: body.input.style_strength || 0.8,
            num_inference_steps: body.input.num_inference_steps || 20
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