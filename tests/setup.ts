import '@testing-library/jest-dom';
import { beforeAll, vi } from 'vitest';

// Mock HTMLCanvasElement
beforeAll(() => {
  // Mock canvas methods
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Array(4) })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    rect: vi.fn(),
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
  });

  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob(['fake-image-data'], { type: 'image/png' }));
  });

  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,fake-data');

  // Mock Image constructor
  global.Image = class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    crossOrigin: string | null = null;
    naturalWidth = 100;
    naturalHeight = 100;
    
    constructor() {
      setTimeout(() => {
        if (this.onload) {
          this.onload();
        }
      }, 0);
    }
    
    set src(_: string) {
      // Trigger onload after a tick
      setTimeout(() => {
        if (this.onload) {
          this.onload();
        }
      }, 0);
    }
  } as any;
});