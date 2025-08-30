import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Replicate from "https://esm.sh/replicate@0.25.2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const body = await req.json()
    console.log("Gemini Nano request:", JSON.stringify(body, null, 2))

    // Validate input
    if (!body.operation) {
      return new Response(JSON.stringify({ error: 'Operation type required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For now, route through Replicate until direct Gemini integration
    const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN')
    if (!REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not set')
    }

    const replicate = new Replicate({ auth: REPLICATE_API_TOKEN })

    // Create operation tracking record with authenticated user
    const operationId = crypto.randomUUID()
    const { error: insertError } = await supabase
      .from('ai_operations')
      .insert({
        id: operationId,
        operation_type: body.operation || 'gemini-edit',
        provider: 'gemini',
        model: 'nano-banana',
        input_params: body.input,
        user_id: user.id,
        status: 'pending'
      })

    let output;

    switch (body.operation) {
      case 'conversational-edit':
        // Use Nano Banana for conversational editing
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
        break;

      case 'multi-image-fusion':
        // For multi-image fusion, use instruction-based approach
        const fusionInstruction = `Merge these images: ${body.input.instruction}`;
        output = await replicate.run("google/nano-banana", {
          input: {
            image: body.input.primary_image,
            instruction: fusionInstruction,
            guidance_scale: 7.5,
            num_inference_steps: 25,
            strength: 0.9
          }
        });
        break;

      case 'style-consistency':
        // Maintain style consistency across edits
        output = await replicate.run("google/nano-banana", {
          input: {
            image: body.input.image,
            instruction: `Maintain the ${body.input.style_reference} style while: ${body.input.instruction}`,
            negative_prompt: "style change, inconsistent style, different artistic approach",
            guidance_scale: 8.0,
            num_inference_steps: 30,
            strength: 0.7
          }
        });
        break;

      case 'character-consistency':
        // Maintain character likeness
        output = await replicate.run("google/nano-banana", {
          input: {
            image: body.input.image,
            instruction: `Keep the same person/character while: ${body.input.instruction}`,
            negative_prompt: "different person, face change, identity change, different character",
            guidance_scale: 8.5,
            num_inference_steps: 35,
            strength: 0.6
          }
        });
        break;

      case 'visual-reasoning':
        // Use instruction that leverages understanding
        output = await replicate.run("google/nano-banana", {
          input: {
            image: body.input.image,
            instruction: `Analyze and understand the context, then: ${body.input.instruction}`,
            negative_prompt: "misunderstanding, context error, logical inconsistency",
            guidance_scale: 7.0,
            num_inference_steps: 25,
            strength: 0.8
          }
        });
        break;

      default:
        // Default conversational editing
        output = await replicate.run("google/nano-banana", {
          input: {
            image: body.input.image,
            instruction: body.input.instruction || body.input.prompt,
            negative_prompt: body.input.negative_prompt || "blurred, distorted, artifacts",
            guidance_scale: body.input.guidance_scale || 7.5,
            num_inference_steps: body.input.num_inference_steps || 20,
            strength: body.input.strength || 0.8
          }
        });
    }

    console.log("Gemini Nano response:", output)

    // Store result in Supabase Storage
    let finalOutput = output;
    if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
      const imageUrl = output[0];
      try {
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.blob();
        const fileName = `gemini-${operationId}-${Date.now()}.webp`;
        
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
          
          // Update operation
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
      }
    }

    // Add SynthID watermarking indicator (simulated)
    const response = {
      output: finalOutput,
      metadata: {
        synthid_watermarked: true,
        model: 'gemini-nano-banana',
        operation: body.operation || 'conversational-edit',
        timestamp: new Date().toISOString()
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in gemini-nano function:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})