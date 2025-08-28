import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Replicate from "https://esm.sh/replicate@0.25.2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN')
    if (!REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not set')
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_TOKEN,
    })

    const body = await req.json()
    console.log("Replicate request:", JSON.stringify(body, null, 2))

    // If it's a status check request
    if (body.predictionId) {
      console.log("Checking status for prediction:", body.predictionId)
      const prediction = await replicate.predictions.get(body.predictionId)
      console.log("Status check response:", prediction)
      return new Response(JSON.stringify(prediction), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate required fields
    if (!body.model || !body.input) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: model and input are required" 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log(`Running model: ${body.model}`)
    console.log(`Operation: ${body.operation}`)

    // Handle different operations
    let output;
    
    if (body.operation === 'nano-banana-edit') {
      // Use Google's Nano Banana model for image editing
      console.log('Running Nano Banana image editing')
      output = await replicate.run("google/nano-banana", {
        input: {
          image: body.input.image,
          instruction: body.input.instruction,
          negative_prompt: body.input.negative_prompt || "blurred, distorted, artifacts, low quality",
          guidance_scale: body.input.guidance_scale || 7.5,
          num_inference_steps: body.input.num_inference_steps || 20,
          strength: body.input.strength || 0.8
        }
      });
    } else if (body.operation === 'face-enhance-upscale') {
      // Enhanced upscaling with face restoration
      console.log('Running face enhancement with upscaling')
      output = await replicate.run("tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3", {
        input: {
          img: body.input.image,
          version: "v1.4",
          scale: body.input.upscale_factor || 2
        }
      });
    } else if (body.operation === 'object-removal') {
      // Use a working object removal model
      console.log('Running object removal with mask')
      output = await replicate.run("andreasjansson/remove-object:ee05b83ade94cd0e11628243fb5c043fffe64d2e3b32f3afe83b6aec8b50a7ab", {
        input: {
          image: body.input.image,
          mask_instruction: body.input.mask_instruction || body.input.prompt,
          mask: body.input.mask
        }
      });
    } else if (body.operation === 'add-object') {
      // Use FLUX.1 for object addition/inpainting with mask
      console.log('Running object addition with FLUX.1 and mask')
      output = await replicate.run("black-forest-labs/flux.1-dev", {
        input: {
          image: body.input.image,
          mask: body.input.mask,
          prompt: body.input.prompt,
          negative_prompt: body.input.negative_prompt || "blurred, distorted, artifacts, unnatural placement",
          guidance_scale: body.input.guidance_scale || 3.5,
          num_inference_steps: body.input.num_inference_steps || 28,
          strength: body.input.strength || 0.8,
          num_outputs: body.input.num_outputs || 1
        }
      });
    } else if (body.operation === 'color-enhance') {
      // Use Nano Banana for color enhancement
      console.log('Running color enhancement with Nano Banana')
      output = await replicate.run("google/nano-banana", {
        input: {
          image: body.input.image,
          instruction: body.input.prompt || "Enhance colors and improve image quality",
          negative_prompt: body.input.negative_prompt || "blurred, distorted, artifacts",
          guidance_scale: 7.5,
          num_inference_steps: 20,
          strength: 0.6
        }
      });
    } else {
      // Default generation or other operations
      console.log(`Running default operation with model: ${body.model}`)
      output = await replicate.run(body.model, {
        input: body.input
      });
    }

    console.log("Generation response:", output)
    return new Response(JSON.stringify({ output }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in replicate function:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})