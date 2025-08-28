# Frame Fuser - Media Pipeline Studio

Phase 1 implementation complete with upload, export, error boundaries, keyboard shortcuts, parameter persistence, and server stubs.

## Quick Start

```bash
npm install
npm run dev:full  # Starts both client and server
```

## Features ✅

- **File Upload**: Multi-file upload with drag support
- **Export**: Single asset and batch export functionality  
- **Error Boundaries**: Robust error handling with retry buttons
- **Keyboard Shortcuts**: Ctrl+Enter (run), G (search), A (select all), Esc (clear)
- **Parameter Persistence**: Settings saved per step/provider combination
- **Server Stubs**: Express API ready for Replicate integration

## Architecture

- Frontend: Vite + React + TypeScript + Tailwind + shadcn/ui
- State: Zustand with IndexedDB persistence
- Backend: Express server with typed routes (stubs)
- Memory Management: Automatic blob URL cleanup

## API Endpoints (Stubs)

- `POST /api/replicate/flux/txt2img` - Text to image
- `POST /api/replicate/seededit/edit` - Image editing  
- `POST /api/replicate/upscale` - Image upscaling
- And more... see server/routes/replicate.ts

Ready for real Replicate integration!