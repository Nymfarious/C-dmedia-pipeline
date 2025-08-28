# Frame Fuser - Media Pipeline Studio

Complete AI-powered media processing pipeline with real provider integration.

## Quick Start

```bash
npm install
npm run dev:full  # Starts both client and server
```

## Features ✅

- **Real AI Integration**: FLUX 1.1, Gemini 2.5 Flash, SeedEdit 3.0, and more
- **Unified API**: Provider-agnostic endpoints with automatic fallbacks  
- **File Upload**: Multi-file upload with drag support
- **Export**: Single asset and batch export functionality
- **Error Boundaries**: Robust error handling with retry buttons
- **Keyboard Shortcuts**: Ctrl+Enter (run), G (search), A (select all), Esc (clear)
- **Parameter Persistence**: Settings saved per step/provider combination

## AI Providers

**Image Generation**: FLUX Pro/Ultra, Gemini Nano Banana, SDXL
**Image Editing**: SeedEdit 3.0, Gemini Edit
**Enhancement**: Real-ESRGAN, GFPGAN upscaling
**Animation**: I2VGen-XL image-to-video
**Audio**: XTTS-v2 voice synthesis

## Environment Setup

```bash
# Copy server/.env.example to server/.env and add:
REPLICATE_API_TOKEN=your_token
GEMINI_API_KEY=your_key
```

Works with fallback responses if no API keys provided.