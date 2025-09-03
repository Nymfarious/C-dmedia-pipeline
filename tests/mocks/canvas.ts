import { vi } from 'vitest';

export const mockCanvasContext = {
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
  globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
  fillStyle: '#000000',
  strokeStyle: '#000000',
  lineWidth: 1,
  font: '10px sans-serif',
  textAlign: 'start' as CanvasTextAlign,
  textBaseline: 'alphabetic' as CanvasTextBaseline,
};

export const mockCanvas = {
  getContext: vi.fn(() => mockCanvasContext),
  toBlob: vi.fn((callback: (blob: Blob) => void) => {
    callback(new Blob(['fake-image-data'], { type: 'image/png' }));
  }),
  toDataURL: vi.fn(() => 'data:image/png;base64,fake-data'),
  width: 800,
  height: 600,
};

export function createMockCanvas(width = 800, height = 600): HTMLCanvasElement {
  return {
    ...mockCanvas,
    width,
    height,
  } as unknown as HTMLCanvasElement;
}