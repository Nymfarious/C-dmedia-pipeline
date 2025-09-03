import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TemplateSpec {
  version: string
  name: string
  description?: string
  category?: string
  canvas: CanvasSpec
  layers: LayerSpec[]
  inputs?: Record<string, TemplateInput>
  outputs?: Record<string, TemplateOutput>
  metadata?: Record<string, any>
}

interface LayerSpec {
  id: string
  type: 'image' | 'text' | 'shape' | 'mask' | 'ai-image' | 'ai-text'
  visible?: boolean
  opacity?: number
  blendMode?: string
  transform?: TransformSpec
  content: any
}

interface AIOperation {
  provider: string
  operation: string
  model?: string
  parameters?: Record<string, any>
  cache?: boolean
  retries?: number
}

interface CanvasSpec {
  width: number
  height: number
  backgroundColor?: string
  format?: 'png' | 'pdf' | 'webp'
  dpi?: number
}

interface TransformSpec {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  scaleX?: number
  scaleY?: number
  anchor?: string
}

interface TemplateInput {
  type: 'text' | 'asset' | 'color' | 'number'
  required?: boolean
  default?: any
  description?: string
}

interface TemplateOutput {
  type: 'image' | 'pdf'
  format?: string
  quality?: number
}

interface TemplatePlacement {
  variables?: Record<string, any>
  assets?: Record<string, any>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { template, placement, options = {} } = await req.json()
    
    console.log('Template composition request:', { 
      templateName: template?.name, 
      placementVars: Object.keys(placement?.variables || {}),
      placementAssets: Object.keys(placement?.assets || {})
    })

    if (!template || !placement) {
      return new Response(
        JSON.stringify({ error: 'Template and placement are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase client for AI operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Process AI layers and generate content
    const processedLayers = await Promise.all(
      template.layers.map(async (layer: LayerSpec) => {
        if (layer.type === 'ai-image' || layer.type === 'ai-text') {
          console.log(`Processing AI layer: ${layer.id} (${layer.type})`)
          return await processAILayer(layer, placement, supabase)
        }
        return layer
      })
    )

    // Create processed template
    const processedTemplate = {
      ...template,
      layers: processedLayers
    }

    // Generate final composite using canvas rendering
    const compositeResult = await renderTemplateComposite(processedTemplate, placement)

    console.log('Template composition completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        output: compositeResult.url,
        metadata: {
          width: template.canvas.width,
          height: template.canvas.height,
          format: template.canvas.format || 'png',
          templateName: template.name,
          aiLayersProcessed: processedLayers.filter(l => l.type.startsWith('ai-')).length,
          processingTime: compositeResult.processingTime
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Template composition error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Template composition failed', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})

async function processAILayer(layer: LayerSpec, placement: TemplatePlacement, supabase: any) {
  const { content } = layer
  const aiOp = content.aiOperation

  try {
    console.log(`Executing AI operation: ${aiOp.provider} - ${aiOp.operation}`)

    // Resolve prompt variables
    let resolvedPrompt = content.prompt
    if (placement.variables) {
      for (const [key, value] of Object.entries(placement.variables)) {
        resolvedPrompt = resolvedPrompt.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value)
        resolvedPrompt = resolvedPrompt.replace(new RegExp(`\\$input\\.${key}`, 'g'), value)
      }
    }

    if (layer.type === 'ai-image') {
      // Route to appropriate AI service for image generation
      let aiResult
      
      if (aiOp.provider.includes('replicate')) {
        // Handle Nano Banana template compositing through Replicate
        if (aiOp.model === 'nano-banana' || aiOp.operation === 'template-edit') {
          aiResult = await supabase.functions.invoke('replicate-enhanced', {
            body: {
              provider: 'replicate',
              model: 'simbrams/nano-banana',
              operation: 'unified-edit',
              input: {
                instruction: resolvedPrompt,
                image: content.sourceImage || placement.assets?.sourceImage?.src,
                negative_prompt: content.negativePrompt || 'blurred, distorted, artifacts',
                steps: 30,
                seed: aiOp.parameters?.seed,
                num_outputs: 1,
                ...aiOp.parameters
              }
            }
          })
        } else {
          aiResult = await supabase.functions.invoke('replicate-enhanced', {
            body: {
              operation: aiOp.operation,
              model: aiOp.model || 'flux-schnell',
              input: {
                prompt: resolvedPrompt,
                negative_prompt: content.negativePrompt || '',
                num_outputs: 1,
                ...aiOp.parameters
              }
            }
          })
        }
      } else if (aiOp.provider.includes('openai')) {
        aiResult = await supabase.functions.invoke('openai-image', {
          body: {
            prompt: resolvedPrompt,
            model: aiOp.model || 'gpt-image-1',
            size: '1024x1024',
            ...aiOp.parameters
          }
        })
      } else if (aiOp.provider.includes('gemini')) {
        aiResult = await supabase.functions.invoke('gemini-nano', {
          body: {
            operation: aiOp.operation,
            input: {
              instruction: resolvedPrompt,
              ...aiOp.parameters
            }
          }
        })
      }

      if (aiResult?.error) {
        console.error(`AI operation failed for layer ${layer.id}:`, aiResult.error)
        // Use fallback or placeholder
        return {
          ...layer,
          type: 'image',
          content: {
            source: content.fallbackSource || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QUkgRmFpbGVkPC90ZXh0Pjwvc3ZnPg==',
            fitMode: 'cover'
          },
          metadata: {
            aiGenerated: false,
            aiError: aiResult.error.message,
            originalPrompt: resolvedPrompt
          }
        }
      }

      // Extract image URL from AI result
      let imageUrl
      if (aiResult?.data?.output) {
        imageUrl = Array.isArray(aiResult.data.output) ? aiResult.data.output[0] : aiResult.data.output
      } else if (aiResult?.data?.image) {
        imageUrl = aiResult.data.image
      }

      return {
        ...layer,
        type: 'image',
        content: {
          source: imageUrl,
          fitMode: content.fitMode || 'cover',
          filters: content.filters
        },
        metadata: {
          aiGenerated: true,
          aiProvider: aiOp.provider,
          originalPrompt: resolvedPrompt,
          processingTime: Date.now()
        }
      }

    } else if (layer.type === 'ai-text') {
      // Generate text using AI
      let textResult
      
      if (aiOp.provider.includes('openai')) {
        textResult = await supabase.functions.invoke('openai-text', {
          body: {
            prompt: resolvedPrompt,
            model: aiOp.model || 'gpt-4o-mini',
            max_tokens: content.maxLength || 100,
            ...aiOp.parameters
          }
        })
      }

      const generatedText = textResult?.data?.generatedText || content.fallbackText || 'AI Generation Failed'

      return {
        ...layer,
        type: 'text',
        content: {
          text: generatedText,
          font: content.font,
          color: content.color,
          alignment: content.alignment
        },
        metadata: {
          aiGenerated: true,
          aiProvider: aiOp.provider,
          originalPrompt: resolvedPrompt
        }
      }
    }

  } catch (error) {
    console.error(`Error processing AI layer ${layer.id}:`, error)
    
    // Return fallback layer
    if (layer.type === 'ai-image') {
      return {
        ...layer,
        type: 'image',
        content: {
          source: content.fallbackSource || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QUkgRXJyb3I8L3RleHQ+PC9zdmc+',
          fitMode: 'cover'
        }
      }
    } else {
      return {
        ...layer,
        type: 'text',
        content: {
          text: content.fallbackText || 'AI Error',
          font: content.font,
          color: content.color,
          alignment: content.alignment
        }
      }
    }
  }

  return layer
}

async function renderTemplateComposite(template: TemplateSpec, placement: TemplatePlacement) {
  const startTime = Date.now()
  
  // Create a simple base64 image as proof of concept
  // In a real implementation, this would use a canvas library like node-canvas
  const width = template.canvas.width
  const height = template.canvas.height
  
  // For now, return a placeholder response
  // TODO: Implement actual canvas rendering with processed AI layers
  const placeholderImage = `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${template.canvas.backgroundColor || '#ffffff'}"/>
      <text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="#333" text-anchor="middle" dy=".3em">
        ${template.name} - Rendered
      </text>
    </svg>
  `)}`
  
  return {
    url: placeholderImage,
    processingTime: Date.now() - startTime
  }
}