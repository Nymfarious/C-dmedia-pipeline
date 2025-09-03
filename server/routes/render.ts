import { Router } from 'express';
import { z } from 'zod';
import { PNGRenderer } from '../compositor/renderPNG';
import { PDFRenderer } from '../compositor/renderPDF';
import { validateTemplate } from '../../src/compositor/TemplateSpec';

const router = Router();

// Request validation schemas
const renderRequestSchema = z.object({
  template_id: z.string().optional(),
  template: z.object({}).optional(),
  placements: z.object({
    text: z.record(z.string()).optional(),
    assets: z.record(z.string()).optional(),
    colors: z.record(z.string()).optional()
  }),
  overrides: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    dpi: z.number().optional(),
    format: z.enum(['png', 'jpeg', 'webp']).optional(),
    quality: z.number().min(1).max(100).optional(),
    embedFonts: z.boolean().optional(),
    hyperlinks: z.array(z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
      url: z.string()
    })).optional()
  }).optional()
});

// Initialize renderers
const pngRenderer = new PNGRenderer();
const pdfRenderer = new PDFRenderer();

// PNG rendering endpoint
router.post('/png', async (req, res) => {
  try {
    const { template_id, template, placements, overrides } = renderRequestSchema.parse(req.body);
    
    // Load template (from ID or direct template object)
    let templateSpec;
    if (template_id) {
    // Load template from file system - implement actual loading
      const fs = await import('fs/promises');
      const path = await import('path');
      try {
        const templatePath = path.join(process.cwd(), 'templates', `${template_id}.json`);
        const templateData = await fs.readFile(templatePath, 'utf-8');
        templateSpec = validateTemplate(JSON.parse(templateData));
      } catch (error) {
        return res.status(404).json({ 
          ok: false, 
          message: 'Template not found',
          userMessage: 'The requested template could not be found.' 
        });
      }
    } else if (template) {
      templateSpec = validateTemplate(template);
    } else {
      return res.status(400).json({ error: 'Either template_id or template must be provided' });
    }

    // Render PNG
    const pngBuffer = await pngRenderer.renderPNG(templateSpec, placements, overrides);
    
    // Return buffer directly
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', pngBuffer.length);
    res.send(pngBuffer);
    
  } catch (error) {
    console.error('PNG rendering error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request format', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PDF rendering endpoint
router.post('/pdf', async (req, res) => {
  try {
    const { template_id, template, placements, overrides } = renderRequestSchema.parse(req.body);
    
    // Load template (from ID or direct template object)
    let templateSpec;
    if (template_id) {
    // Load template from file system - implement actual loading  
      const fs = await import('fs/promises');
      const path = await import('path');
      try {
        const templatePath = path.join(process.cwd(), 'templates', `${template_id}.json`);
        const templateData = await fs.readFile(templatePath, 'utf-8');
        templateSpec = validateTemplate(JSON.parse(templateData));
      } catch (error) {
        return res.status(404).json({ 
          ok: false, 
          message: 'Template not found',
          userMessage: 'The requested template could not be found.' 
        });
      }
    } else if (template) {
      templateSpec = validateTemplate(template);
    } else {
      return res.status(400).json({ error: 'Either template_id or template must be provided' });
    }

    // Render PDF
    const pdfBuffer = await pdfRenderer.renderPDF(templateSpec, placements, {
      ...overrides,
      embedFonts: true // Always embed fonts for better compatibility
    });
    
    // Return buffer directly
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', 'inline; filename="rendered.pdf"');
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('PDF rendering error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request format', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint for rendering service
router.get('/health', async (req, res) => {
  try {
    // Test basic functionality with a minimal template
    const testTemplate = {
      version: '1.0',
      name: 'Health Check',
      canvas: { width: 100, height: 100, backgroundColor: '#ffffff' },
      layers: [],
      inputs: [],
      outputs: []
    };
    
    const testPlacements = { text: {}, assets: {}, colors: {} };
    
    // Test PNG rendering
    const startTime = Date.now();
    await pngRenderer.renderPNG(testTemplate, testPlacements, { width: 50, height: 50 });
    const pngLatency = Date.now() - startTime;
    
    // Test PDF rendering
    const pdfStartTime = Date.now();
    await pdfRenderer.renderPDF(testTemplate, testPlacements);
    const pdfLatency = Date.now() - pdfStartTime;
    
    res.json({
      status: 'healthy',
      services: {
        png: { status: 'healthy', latency_ms: pngLatency },
        pdf: { status: 'healthy', latency_ms: pdfLatency }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Render health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;