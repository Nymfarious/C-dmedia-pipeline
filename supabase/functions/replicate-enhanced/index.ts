import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Replicate from "https://esm.sh/replicate@0.25.2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Working Replicate model configurations
const MODEL_CONFIG = {
  // Generation models
  'flux-schnell': 'black-forest-labs/flux-schnell',
  'flux-dev': 'black-forest-labs/flux-dev', 
  'flux-pro': 'black-forest-labs/flux-pro',
  'sdxl': 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
  'stable-diffusion': 'stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478',
  
  // Editing models
  'nano-banana': 'google-research/nano-banana',
  'background-remove': 'cjwbw/rembg',
  'flux-inpaint': 'black-forest-labs/flux-fill-dev',
  'flux-inpaint-pro': 'black-forest-labs/flux-fill-pro',
  'upscale': 'nightmareai/real-esrgan',
  'birefnet': 'cjwbw/rembg', // Use working background removal
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to ensure image URLs are public and accessible
async function ensurePublicImageUrl(url: string): Promise<string> {
  console.log('🔍 Validating image URL:', url);
  
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) {
    throw new Error('Invalid image URL. Images must be publicly accessible HTTP/HTTPS URLs.');
  }
  
  // Test if URL is accessible
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      console.log(`⚠️ URL returned ${response.status}, attempting to recover...`);
      
      // If it's a Replicate URL that expired, try to download and store in Supabase
      if (url.includes('replicate.delivery')) {
        console.log('🔄 Attempting to recover expired Replicate URL...');
        return await downloadAndStoreImage(url);
      }
      
      throw new Error(`Image URL not accessible: ${response.status}`);
    }
    console.log('✅ Image URL is accessible');
    return url;
  } catch (error) {
    console.error('❌ Image URL validation failed:', error);
    
    // For Replicate URLs, try recovery even if fetch fails
    if (url.includes('replicate.delivery')) {
      console.log('🔄 Attempting recovery for failed Replicate URL...');
      try {
        return await downloadAndStoreImage(url);
      } catch (recoveryError) {
        console.error('❌ Recovery failed:', recoveryError);
      }
    }
    
    throw new Error(`Failed to access image URL: ${error.message}`);
  }
}

// Helper function to download and store image in Supabase storage
async function downloadAndStoreImage(originalUrl: string): Promise<string> {
  try {
    console.log('📥 Downloading image for storage:', originalUrl);
    
    // Try to download the image with a fresh fetch
    const response = await fetch(originalUrl);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    
    const blob = await response.blob();
    const timestamp = Date.now();
    const fileName = `recovered-${timestamp}.${blob.type.split('/')[1] || 'webp'}`;
    const filePath = `ai-images/${fileName}`;
    
    console.log('💾 Storing image in Supabase storage:', filePath);
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('ai-images')
      .upload(filePath, blob, {
        contentType: blob.type,
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('ai-images')
      .getPublicUrl(filePath);
    
    console.log('✅ Image recovered and stored:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Failed to download and store image:', error);
    throw new Error(`Image recovery failed: ${error.message}`);
  }
}

// Helper function to ensure mask URLs are valid (allows data URLs)
function ensureMaskUrl(url: string): string {
  console.log('🔍 Validating mask URL:', url.substring(0, 50) + '...');
  
  if (!url) {
    throw new Error('Mask URL is required');
  }
  
  // Allow data URLs for masks (client-side generated)
  if (url.startsWith('data:image/')) {
    console.log('✅ Valid data URL mask');
    return url;
  }
  
  // Also allow HTTP URLs for masks
  if (url.startsWith('http')) {
    console.log('✅ Valid HTTP URL mask');
    return url;
  }
  
  throw new Error('Invalid mask URL format. Expected data URL or HTTP/HTTPS URL.');
}

// Helper function to persist image to Supabase storage instead of using temporary URLs
async function persistToSupaFromUrlOrBuffer(url: string, fileName: string): Promise<{ publicUrl: string }> {
  try {
    console.log('💾 Persisting image to Supabase storage:', fileName);
    
    let blob: Blob;
    let contentType = 'image/webp'; // Default
    
    // Determine content type from filename or URL
    if (fileName.endsWith('.png')) {
      contentType = 'image/png';
    } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (fileName.endsWith('.webp')) {
      contentType = 'image/webp';
    }
    
    if (url.startsWith('data:')) {
      // Convert data URL to blob
      const response = await fetch(url);
      blob = await response.blob();
      
      // Extract content type from data URL if available
      const dataUrlMatch = url.match(/^data:([^;]+);/);
      if (dataUrlMatch) {
        contentType = dataUrlMatch[1];
      }
    } else {
      // Download from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      blob = await response.blob();
      
      // Use blob type if available and valid
      if (blob.type && blob.type !== 'application/octet-stream') {
        contentType = blob.type;
      }
    }
    
    const filePath = `edits/${fileName}`;
    
    console.log(`📄 Uploading with content type: ${contentType}`);
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('ai-images')
      .upload(filePath, blob, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('ai-images')
      .getPublicUrl(filePath);
    
    console.log('✅ Image persisted to storage:', publicUrl);
    return { publicUrl };
    
  } catch (error) {
    console.error('❌ Failed to persist image:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Add request timeout
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), 120000); // 2 minute timeout

  try {
    // Validate all required environment variables upfront
    const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!REPLICATE_API_TOKEN) {
      console.error('❌ Missing REPLICATE_API_TOKEN environment variable')
      throw new Error('REPLICATE_API_TOKEN is not set')
    }
    if (!SUPABASE_URL) {
      console.error('❌ Missing SUPABASE_URL environment variable')
      throw new Error('SUPABASE_URL is not set')
    }
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }
    
    console.log('✅ All required environment variables present')

    const replicate = new Replicate({ auth: REPLICATE_API_TOKEN })
    const body = await req.json()
    console.log("Enhanced Replicate request:", JSON.stringify(body, null, 2))

    // Phase 3.1: Comprehensive input validation
    if (!body.operation) {
      return new Response(
        JSON.stringify({ error: "Missing required field: operation is required" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    if (!body.input) {
      return new Response(
        JSON.stringify({ error: "Missing required field: input object is required" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    if (!body.input.prompt && !body.input.instruction) {
      return new Response(
        JSON.stringify({ error: "Missing prompt: either 'prompt' or 'instruction' is required" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate and ensure all image URLs are publicly accessible
    if (body.input.image) {
      console.log('🔍 Processing input image URL...')
      body.input.image = await ensurePublicImageUrl(body.input.image);
    }
    
    // For masks, always upload to storage instead of using data URLs
    if (body.input.mask) {
      console.log('🎭 Processing mask URL...')
      if (body.input.mask.startsWith('data:')) {
        console.log('📤 Converting data URL mask to storage URL...')
        const timestamp = Date.now()
        const fileName = `mask-${timestamp}.png`
        const maskResult = await persistToSupaFromUrlOrBuffer(body.input.mask, fileName)
        body.input.mask = maskResult.publicUrl
        console.log('✅ Mask uploaded to storage:', body.input.mask)
      } else {
        body.input.mask = ensureMaskUrl(body.input.mask);
      }
    }
    
    if (body.input.images) {
      console.log('🖼️ Processing multiple image URLs...')
      for (let i = 0; i < body.input.images.length; i++) {
        body.input.images[i] = await ensurePublicImageUrl(body.input.images[i]);
      }
    }

    let output;
    let modelKey = body.operation;
    
    console.log(`Running operation: ${body.operation}`)

    switch (body.operation) {
      case 'generate':
        // Handle image generation
        const generationModel = body.model || 'flux-schnell';
        modelKey = generationModel;
        
        if (!MODEL_CONFIG[modelKey]) {
          throw new Error(`Unsupported generation model: ${generationModel}`);
        }
        
        console.log(`Generating image with model: ${generationModel}`);
        
        // Build generation input based on model type
        const generationInput: any = {
          prompt: body.input.prompt,
          num_outputs: body.input.num_outputs || 1,
          guidance_scale: body.input.guidance_scale || 3.5,
          num_inference_steps: body.input.num_inference_steps || 4
        };
        
        // Add model-specific parameters
        if (generationModel.includes('flux')) {
          generationInput.aspect_ratio = body.input.aspect_ratio || "1:1";
          generationInput.output_format = body.input.output_format || "webp";
          generationInput.output_quality = body.input.output_quality || 80;
          if (body.input.seed) generationInput.seed = body.input.seed;
        } else if (generationModel.includes('sdxl') || generationModel.includes('stable')) {
          generationInput.width = body.input.width || 1024;
          generationInput.height = body.input.height || 1024;
          generationInput.scheduler = "K_EULER";
          if (body.input.negative_prompt) generationInput.negative_prompt = body.input.negative_prompt;
          if (body.input.seed) generationInput.seed = body.input.seed;
        }
        
        output = await replicate.run(MODEL_CONFIG[modelKey], {
          input: generationInput
        });
        break;

      case 'nano-banana-edit':
        // Enhanced Nano Banana with hybrid workflow support
        modelKey = 'flux-inpaint';
        
        console.log('🎯 Enhanced Nano Banana processing with mode:', body.input.mode || 'smart-inpaint');
        
        // Use enhanced prompt if provided, otherwise use instruction/prompt
        const enhancedPrompt = body.input.enhanced_prompt || body.input.instruction || body.input.prompt || 'Edit this image intelligently';
        const negativePrompt = body.input.negative_prompt || 'artifacts, distortion, low quality, unnatural, poor blending';
        
        // Support both masked and non-masked editing
        if (body.input.mask) {
          // Masked editing: Use FLUX inpaint with enhanced prompts
          console.log('🎨 Masked Nano Banana editing');
          output = await replicate.run(MODEL_CONFIG[modelKey], {
            input: {
              image: body.input.image,
              mask: body.input.mask,
              prompt: enhancedPrompt,
              negative_prompt: negativePrompt,
              guidance_scale: body.input.guidance_scale || 10.5,
              num_inference_steps: body.input.num_inference_steps || 40,
              strength: body.input.strength || 0.88
            }
          });
        } else {
          // Global editing: Use natural language model (fallback to FLUX generation)
          console.log('🌐 Global Nano Banana editing');
          output = await replicate.run(MODEL_CONFIG['flux-dev'], {
            input: {
              prompt: `${enhancedPrompt}, based on this reference image`,
              image: body.input.image,
              prompt_strength: body.input.strength || 0.8,
              num_inference_steps: body.input.num_inference_steps || 30,
              guidance_scale: body.input.guidance_scale || 8.5
            }
          });
        }
        break;

      case 'background-removal':
        modelKey = 'background-remove';
        output = await replicate.run(MODEL_CONFIG[modelKey], {
          input: { 
            image: body.input.image
          }
        });
        break;

      case 'flux-inpaint':
        modelKey = 'flux-inpaint';
        if (!body.input.mask) {
          throw new Error('Mask required for inpainting operation');
        }
        
        // Double-check image URL accessibility before sending to Replicate
        console.log('🔍 Final image URL validation before Replicate call:', body.input.image);
        try {
          const imageCheck = await fetch(body.input.image, { method: 'HEAD' });
          if (!imageCheck.ok) {
            throw new Error(`Image URL not accessible: ${imageCheck.status} ${imageCheck.statusText}`);
          }
          console.log('✅ Image URL verified accessible for FLUX inpaint');
        } catch (urlError) {
          console.error('❌ Image URL validation failed before FLUX inpaint:', urlError);
          throw new Error(`Image URL validation failed: ${urlError.message}`);
        }
        
        // Add retry logic for FLUX inpaint
        const maxRetries = 2;
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`🔄 FLUX inpaint attempt ${attempt}/${maxRetries}`);
            
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
            
            // If successful, break out of retry loop
            break;
            
          } catch (attemptError) {
            console.error(`❌ FLUX inpaint attempt ${attempt} failed:`, attemptError);
            lastError = attemptError;
            
            if (attempt === maxRetries) {
              throw attemptError;
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
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

    // Phase 3.2: Extract and persist output to prevent expired URLs
    let imageUrl = output;
    if (Array.isArray(output) && output.length > 0) {
      imageUrl = output[0];
    }

    if (typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      throw new Error('No image content found in response');
    }

    // Always persist to Supabase storage to prevent 404s from expired replicate.delivery URLs
    const timestamp = Date.now();
    const fileName = `${body.operation}-${timestamp}.webp`;
    const persisted = await persistToSupaFromUrlOrBuffer(imageUrl, fileName);

    return new Response(JSON.stringify({ 
      output: persisted.publicUrl,
      // Also return original for debugging if needed
      originalUrl: imageUrl 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("❌ Error in replicate-enhanced function:", error)
    console.error("❌ Error stack:", error.stack)
    
    // Provide more specific error handling with detailed logging
    let statusCode = 500;
    let errorMessage = error.message;
    
    // Log specific error types for debugging
    if (error.message.includes('REPLICATE_API_TOKEN')) {
      console.error('🔑 Environment variable error: REPLICATE_API_TOKEN missing')
      statusCode = 500;
      errorMessage = 'Server configuration error: Missing API token'
    } else if (error.message.includes('SUPABASE_URL') || error.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      console.error('🏪 Environment variable error: Supabase configuration missing')
      statusCode = 500;
      errorMessage = 'Server configuration error: Missing Supabase configuration'
    } else if (error.message.includes('Image URL not accessible')) {
      console.error('🖼️ Image accessibility error:', error.message)
      statusCode = 400;
      errorMessage = `Image error: ${error.message}`
    } else if (error.message.includes('Mask')) {
      console.error('🎭 Mask processing error:', error.message)
      statusCode = 400;
      errorMessage = `Mask error: ${error.message}`
    } else if (error.name === 'AbortError') {
      statusCode = 408;
      errorMessage = 'Request timeout - operation took too long';
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      statusCode = 404;
      errorMessage = 'Resource not found - likely expired image URL';
    } else if (error.message.includes('403') || error.message.includes('unauthorized')) {
      statusCode = 403;
      errorMessage = 'Access denied - check API credentials';
    } else if (error.message.includes('rate limit')) {
      statusCode = 429;
      errorMessage = 'API rate limit exceeded - please try again later';
    }
    
    let requestBody;
    try {
      requestBody = body;
    } catch {
      requestBody = { operation: 'unknown' };
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      operation: requestBody?.operation || 'unknown',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    })
  } finally {
    clearTimeout(timeout);
  }
})