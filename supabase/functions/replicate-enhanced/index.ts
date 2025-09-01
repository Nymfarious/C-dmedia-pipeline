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
  
  // Video generation models
  'veo-3': 'google/veo-3',
  
  // Video editing models
  'sedance-1-pro': 'bytedance/sedance-1-pro',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to ensure image URLs are public and accessible
async function ensurePublicImageUrl(url: string): Promise<string> {
  console.log('🔍 Validating image URL:', url);
  
  if (!url) {
    throw new Error('Invalid image URL. Images must be publicly accessible HTTP/HTTPS URLs.');
  }
  
  // Handle data URLs by uploading them to storage
  if (url.startsWith('data:')) {
    console.log('🔄 Converting data URL to storage URL...');
    try {
      const timestamp = Date.now();
      const fileName = `data-convert-${timestamp}.webp`;
      const uploadResult = await persistToSupaFromUrlOrBuffer(url, fileName);
      console.log('✅ Data URL converted to storage URL:', uploadResult.publicUrl);
      return uploadResult.publicUrl;
    } catch (error) {
      console.error('❌ Failed to convert data URL:', error);
      throw new Error(`Data URL conversion failed: ${error.message}`);
    }
  }
  
  // Reject blob URLs (can't be accessed from server context)
  if (url.startsWith('blob:')) {
    throw new Error('Blob URLs not supported. Please convert to data URL first.');
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

// Helper function to persist image/video to Supabase storage instead of using temporary URLs
async function persistToSupaFromUrlOrBuffer(url: string, fileName: string): Promise<{ publicUrl: string }> {
  try {
    console.log('💾 Persisting media to Supabase storage:', fileName);
    
    let blob: Blob;
    let contentType = 'image/webp'; // Default
    
    // Determine content type from filename or URL
    if (fileName.endsWith('.png')) {
      contentType = 'image/png';
    } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (fileName.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (fileName.endsWith('.mp4')) {
      contentType = 'video/mp4';
    } else if (fileName.endsWith('.mov')) {
      contentType = 'video/quicktime';
    } else if (fileName.endsWith('.avi')) {
      contentType = 'video/x-msvideo';
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
        throw new Error(`Failed to fetch media: ${response.status}`);
      }
      blob = await response.blob();
      
      // Use blob type if available and valid
      if (blob.type && blob.type !== 'application/octet-stream') {
        contentType = blob.type;
      }
    }
    
    // Determine bucket and path based on content type
    const isVideo = contentType.startsWith('video/');
    const bucket = isVideo ? 'ai-videos' : 'ai-images';
    const folder = isVideo ? 'videos' : 'edits';
    const filePath = `${folder}/${fileName}`;
    
    console.log(`📄 Uploading ${isVideo ? 'video' : 'image'} to bucket '${bucket}' with content type: ${contentType}`);
    
    // Upload to appropriate Supabase storage bucket
    const { data, error } = await supabase.storage
      .from(bucket)
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
      .from(bucket)
      .getPublicUrl(filePath);
    
    console.log(`✅ ${isVideo ? 'Video' : 'Image'} persisted to storage: ${publicUrl}`);
    return { publicUrl };
    
  } catch (error) {
    console.error(`❌ Failed to persist media:`, error);
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
        
        // Handle reference images for img2img
        if (body.input.reference_images && body.input.reference_images.length > 0) {
          console.log('🖼️ Processing reference images for generation...');
          
          // For now, use the first reference image as the base image for img2img
          const primaryReference = body.input.reference_images[0];
          
          if (primaryReference.url) {
            generationInput.image = await ensurePublicImageUrl(primaryReference.url);
            generationInput.strength = 1.0 - (primaryReference.weight || 0.7); // Convert weight to strength
            console.log(`✅ Using reference image with strength: ${generationInput.strength}`);
          }
          
          // For multiple references, we could blend them or use as style references
          if (body.input.reference_images.length > 1) {
            console.log(`ℹ️ Multiple references detected (${body.input.reference_images.length}), using first as primary`);
            // Future enhancement: blend multiple references or use advanced models
          }
        }
        
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

      case 'text-generation':
        // Handle AI text generation using Flux models
        console.log('🎨 Generating AI text overlay using Flux');
        
        if (!body.input.image) {
          throw new Error('Base image required for text generation');
        }
        
        const textModel = 'flux-dev'; // Use Flux Dev for text generation
        const textPrompt = body.input.text_prompt || 'Add stylized text';
        const textStyle = body.input.text_style || {};
        
        // Build enhanced prompt for text generation with better positioning
        let enhancedTextPrompt = `Add beautiful, professional text "${textPrompt}" to this image. `;
        
        // Add positioning guidance
        if (body.input.position) {
          const positionMap = {
            'top-left': 'Place the text in the top-left corner',
            'top-center': 'Place the text at the top center',
            'top-right': 'Place the text in the top-right corner',
            'center-left': 'Place the text on the left side center',
            'center': 'Place the text in the center',
            'center-right': 'Place the text on the right side center',
            'bottom-left': 'Place the text in the bottom-left corner',
            'bottom-center': 'Place the text at the bottom center',
            'bottom-right': 'Place the text in the bottom-right corner'
          };
          enhancedTextPrompt += `${positionMap[body.input.position] || 'Place the text appropriately'}. `;
        }
        
        // Add style specifications
        if (textStyle.fontSize) {
          const sizeMap = {
            'small': 'Use small, subtle text',
            'medium': 'Use medium-sized text',
            'large': 'Use large, prominent text',
            'xl': 'Use extra large, bold text'
          };
          enhancedTextPrompt += `${sizeMap[textStyle.fontSize] || 'Use appropriately sized text'}. `;
        }
        
        if (textStyle.color && textStyle.color !== 'auto') {
          enhancedTextPrompt += `Text color should be ${textStyle.color}. `;
        }
        
        if (textStyle.effect && textStyle.effect !== 'none') {
          const effectMap = {
            'shadow': 'Add a subtle drop shadow effect',
            'glow': 'Add a soft glowing effect around the text',
            'outline': 'Add a contrasting outline around the text',
            '3d': 'Create a 3D effect with depth and dimension'
          };
          enhancedTextPrompt += `${effectMap[textStyle.effect] || 'Apply stylistic effects'}. `;
        }
        
        enhancedTextPrompt += 'The text should perfectly integrate with the image style, lighting, and perspective. Ensure excellent readability and professional typography. Maintain the original image composition while adding the text seamlessly.';
        
        console.log('Enhanced text prompt:', enhancedTextPrompt);
        
        // Use img2img with Flux for better text integration
        output = await replicate.run(MODEL_CONFIG[textModel], {
          input: {
            prompt: enhancedTextPrompt,
            image: body.input.image,
            strength: 0.4, // Lower strength to preserve original image better
            guidance_scale: 7.5,
            num_inference_steps: 30,
            output_format: "webp",
            output_quality: 90
          }
        });
        
        // Persist the result to Supabase storage immediately
        if (output) {
          const timestamp = Date.now();
          const fileName = `text-gen-${timestamp}.webp`;
          const persistResult = await persistToSupaFromUrlOrBuffer(Array.isArray(output) ? output[0] : output, fileName);
          output = persistResult.publicUrl;
          console.log('✅ Text generation result persisted:', output);
        }
        break;

      case 'nano-banana-edit':
        console.log('🎯 Using Google Nano-Banana model for editing');
        
        // **CRITICAL TYPE SAFETY**: Ensure prompt is always a string
        let enhancedPrompt = body.input.enhanced_prompt || body.input.instruction || body.input.prompt || 'Edit this image intelligently';
        
        // Phase 1: Strict type validation and defensive conversion
        if (typeof enhancedPrompt !== 'string') {
          console.error('🚨 Type validation error - enhanced_prompt is not a string:', {
            type: typeof enhancedPrompt,
            value: enhancedPrompt,
            fullInput: JSON.stringify(body.input, null, 2)
          });
          
          // Defensive type conversion
          if (enhancedPrompt && typeof enhancedPrompt === 'object') {
            if (enhancedPrompt.prompt) {
              enhancedPrompt = String(enhancedPrompt.prompt);
              console.log('⚠️ Extracted prompt from object:', enhancedPrompt);
            } else {
              enhancedPrompt = JSON.stringify(enhancedPrompt);
              console.log('⚠️ Converted object to JSON string:', enhancedPrompt);
            }
          } else {
            enhancedPrompt = String(enhancedPrompt || 'Edit this image intelligently');
            console.log('⚠️ Forced string conversion:', enhancedPrompt);
          }
        }
        
        // Additional validation for other prompt fields
        const instruction = typeof body.input.instruction === 'string' ? body.input.instruction : String(body.input.instruction || '');
        const basePrompt = typeof body.input.prompt === 'string' ? body.input.prompt : String(body.input.prompt || '');
        
        console.log('✅ Validated prompt types:', {
          enhanced_prompt_type: typeof enhancedPrompt,
          instruction_type: typeof instruction,
          prompt_type: typeof basePrompt,
          enhanced_prompt_preview: enhancedPrompt.substring(0, 100)
        });
        
        // Route to proper inpainting model based on mask presence
        if (body.input.mask) {
          console.log('🎨 Using Flux Fill Pro for true masked inpainting');
          console.log('🔍 Final image URL validation before Replicate call:', body.input.image);
          console.log('🔍 Final mask URL validation before Replicate call:', body.input.mask);
          
          // Use Flux Fill Pro for true inpainting that respects masks
          modelKey = 'flux-inpaint-pro';
          output = await replicate.run(MODEL_CONFIG[modelKey], {
            input: {
              image: body.input.image,              // original waterfall
              mask: body.input.mask,                // white = edit area
              prompt: enhancedPrompt,               // "add small birds near the fall..."
              num_inference_steps: body.input.num_inference_steps || 30,
              guidance_scale: body.input.guidance_scale || 7.5,
              // Flux Fill preserves context automatically, no strength needed
            }
          });
        } else {
          console.log('🌟 Global Nano Banana edit with global-edit mode');
          
          // Upload input image to Supabase storage to ensure accessibility
          const timestamp = Date.now();
          const inputFileName = `input-${timestamp}.webp`;
          const inputImageResult = await persistToSupaFromUrlOrBuffer(body.input.image, inputFileName);
          const publicImageUrl = inputImageResult.publicUrl;
          console.log('✅ Input image uploaded to storage:', publicImageUrl);
          
          // Keep nano-banana for global edits only
          output = await replicate.run("google/nano-banana", {
            input: {
              image: publicImageUrl,
              mode: "global-edit",
              prompt: enhancedPrompt,
              guidance_scale: body.input.guidance_scale || 7.5,
              strength: body.input.strength || 0.8,
              num_inference_steps: body.input.num_inference_steps || 20
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

      case 'image-to-video':
        console.log('🎬 Generating video with VEO 3');
        modelKey = 'veo-3';
        
        if (!MODEL_CONFIG[modelKey]) {
          throw new Error(`Unsupported video model: veo-3`);
        }
        
        const videoInput: any = {
          prompt: body.input.prompt
        };
        
        // Add image for image-to-video generation
        if (body.input.image) {
          videoInput.image = body.input.image;
        }
        
        // VEO 3 specific parameters
        if (body.input.duration) videoInput.duration = body.input.duration;
        if (body.input.aspect_ratio) videoInput.aspect_ratio = body.input.aspect_ratio;
        if (body.input.motion_strength) videoInput.motion_strength = body.input.motion_strength;
        if (body.input.seed) videoInput.seed = body.input.seed;
        
        console.log('VEO 3 input parameters:', JSON.stringify(videoInput, null, 2));
        
        output = await replicate.run(MODEL_CONFIG[modelKey], {
          input: videoInput
        });
        
        // Handle video output differently - persist as MP4
        if (output) {
          const timestamp = Date.now();
          const fileName = `veo3-video-${timestamp}.mp4`;
          const persistResult = await persistToSupaFromUrlOrBuffer(Array.isArray(output) ? output[0] : output, fileName);
          output = persistResult.publicUrl;
          console.log('✅ Video generation result persisted:', output);
        }
        break;

      case 'video-edit':
        console.log('🎬 Editing video with SeDance-1 Pro');
        modelKey = 'sedance-1-pro';
        
        if (!MODEL_CONFIG[modelKey]) {
          throw new Error(`Unsupported video editing model: sedance-1-pro`);
        }
        
        if (!body.input.video) {
          throw new Error('Video input required for video editing');
        }
        
        const videoEditInput: any = {
          video: body.input.video,
          prompt: body.input.prompt || body.input.instruction,
        };
        
        // SeDance-1 Pro specific parameters
        if (body.input.motion_strength) videoEditInput.motion_strength = body.input.motion_strength;
        if (body.input.structure_strength) videoEditInput.structure_strength = body.input.structure_strength;
        if (body.input.seed) videoEditInput.seed = body.input.seed;
        if (body.input.num_frames) videoEditInput.num_frames = body.input.num_frames;
        if (body.input.fps) videoEditInput.fps = body.input.fps;
        if (body.input.aspect_ratio) videoEditInput.aspect_ratio = body.input.aspect_ratio;
        
        console.log('SeDance-1 Pro input parameters:', JSON.stringify(videoEditInput, null, 2));
        
        output = await replicate.run(MODEL_CONFIG[modelKey], {
          input: videoEditInput
        });
        
        // Handle video output - persist as MP4
        if (output) {
          const timestamp = Date.now();
          const fileName = `sedance-video-${timestamp}.mp4`;
          const persistResult = await persistToSupaFromUrlOrBuffer(Array.isArray(output) ? output[0] : output, fileName);
          output = persistResult.publicUrl;
          console.log('✅ Video editing result persisted:', output);
        }
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
    } else if (error.message.includes('Additional property') && error.message.includes('not allowed')) {
      console.error('🚫 Replicate parameter validation error:', error.message)
      statusCode = 422;
      errorMessage = `Model parameter error: The model doesn't accept one of the provided parameters. Check the model documentation.`
    } else if (error.message.includes('Request to https://api.replicate.com') && error.message.includes('422')) {
      console.error('🤖 Replicate API validation error:', error.message)
      statusCode = 422;
      errorMessage = `Replicate API validation error: ${error.message}`
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