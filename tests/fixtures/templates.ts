import { TemplateSpec, TemplatePlacement } from '@/compositor/TemplateSpec';

export const mockTemplateSpec: TemplateSpec = {
  id: 'test-template',
  name: 'Test Template',
  description: 'A test template for unit tests',
  version: '1.0',
  canvas: {
    width: 800,
    height: 600,
    background: '#ffffff',
  },
  layers: [
    {
      id: 'background',
      type: 'shape',
      name: 'Background',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      zIndex: 0,
      transform: {
        x: 0,
        y: 0,
        width: '100%',
        height: '100%',
      },
      shape: {
        type: 'rectangle',
        fill: '#f0f0f0',
      },
    },
    {
      id: 'title-text',
      type: 'text',
      name: 'Title',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      zIndex: 1,
      transform: {
        x: '10%',
        y: '10%',
        width: '80%',
        height: '20%',
        anchor: 'top-left',
      },
      text: {
        content: '${title}',
        font: {
          family: 'Arial',
          size: 24,
          weight: 'bold',
        },
        color: '#333333',
        align: 'center',
        verticalAlign: 'middle',
      },
    },
    {
      id: 'logo-image',
      type: 'image',
      name: 'Logo',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      zIndex: 2,
      transform: {
        x: '50%',
        y: '50%',
        width: 200,
        height: 200,
        anchor: 'center',
      },
      image: {
        source: '$asset_logo',
        fit: 'contain',
      },
    },
  ],
  inputs: [
    {
      id: 'title',
      name: 'Title Text',
      type: 'text',
      required: true,
    },
    {
      id: 'asset_logo',
      name: 'Logo Image',
      type: 'image',
      required: true,
    },
  ],
};

export const mockPlacements: TemplatePlacement = {
  title: 'Test Title',
  asset_logo: 'https://example.com/logo.png',
};

export const mockComplexTemplate: TemplateSpec = {
  id: 'complex-template',
  name: 'Complex Test Template',
  description: 'A more complex template for testing',
  version: '1.0',
  canvas: {
    width: 1200,
    height: 800,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  layers: [
    {
      id: 'hero-bg',
      type: 'shape',
      name: 'Hero Background',
      visible: true,
      opacity: 0.8,
      blendMode: 'multiply',
      zIndex: 0,
      transform: {
        x: 0,
        y: 0,
        width: '100%',
        height: '60%',
      },
      shape: {
        type: 'rectangle',
        fill: 'rgba(0, 0, 0, 0.3)',
      },
    },
    {
      id: 'main-text',
      type: 'text',
      name: 'Main Text',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      zIndex: 1,
      transform: {
        x: '5%',
        y: '15%',
        width: '90%',
        height: '30%',
      },
      text: {
        content: '${mainText}',
        font: {
          family: 'Helvetica',
          size: 36,
          weight: 'normal',
        },
        color: '#ffffff',
        align: 'left',
        verticalAlign: 'top',
      },
    },
  ],
  inputs: [
    {
      id: 'mainText',
      name: 'Main Text',
      type: 'text',
      required: true,
    },
  ],
};

export const mockComplexPlacements: TemplatePlacement = {
  mainText: 'This is a complex template with gradients and blending',
};