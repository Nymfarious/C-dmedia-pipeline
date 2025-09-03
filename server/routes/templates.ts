import { Router } from 'express';
import { z } from 'zod';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { validateTemplate } from '../../src/compositor/TemplateSpec';

const router = Router();

// Template loading endpoint
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const templatePath = join(process.cwd(), 'templates', `${id}.json`);
    
    if (!existsSync(templatePath)) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const templateData = await readFile(templatePath, 'utf8');
    const template = JSON.parse(templateData);
    
    // Validate template structure
    const validatedTemplate = validateTemplate(template);
    
    res.json(validatedTemplate);
  } catch (error) {
    console.error('Error loading template:', error);
    res.status(500).json({ 
      error: 'Failed to load template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Template validation endpoint
router.post('/templates/validate', async (req, res) => {
  try {
    const template = req.body;
    const validatedTemplate = validateTemplate(template);
    
    res.json({ 
      valid: true, 
      template: validatedTemplate 
    });
  } catch (error) {
    res.status(400).json({ 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid template'
    });
  }
});

// Available templates listing
router.get('/templates', async (req, res) => {
  try {
    const templatesDir = join(process.cwd(), 'templates');
    
    if (!existsSync(templatesDir)) {
      return res.json({ templates: [] });
    }
    
    const { readdir } = await import('fs/promises');
    const files = await readdir(templatesDir);
    const templateFiles = files.filter(file => file.endsWith('.json'));
    
    const templates = await Promise.all(
      templateFiles.map(async (file) => {
        try {
          const templatePath = join(templatesDir, file);
          const templateData = await readFile(templatePath, 'utf8');
          const template = JSON.parse(templateData);
          
          return {
            id: file.replace('.json', ''),
            name: template.name || file,
            description: template.description || '',
            canvas: template.canvas
          };
        } catch (error) {
          console.error(`Error loading template ${file}:`, error);
          return null;
        }
      })
    );
    
    const validTemplates = templates.filter(t => t !== null);
    
    res.json({ templates: validTemplates });
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

export default router;