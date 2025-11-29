// Sprite Sheet Slicer Utility
// Slices sprite sheets into individual images based on grid layout

export type SpliceGrid = '2x2' | '2x3' | '3x2' | '3x3' | '3x4' | '4x3' | '4x4';

export interface SliceResult {
  id: string;
  name: string;
  blob: Blob;
  dataUrl: string;
  row: number;
  col: number;
  width: number;
  height: number;
}

export interface SliceOptions {
  grid: SpliceGrid;
  sourceImage: HTMLImageElement | string;
  outputFormat?: 'image/png' | 'image/webp' | 'image/jpeg';
  quality?: number;
}

// Parse grid string to rows/cols
export function parseGrid(grid: SpliceGrid): { rows: number; cols: number } {
  const [cols, rows] = grid.split('x').map(Number);
  return { rows, cols };
}

// Get available grid options
export const GRID_OPTIONS: { value: SpliceGrid; label: string; cells: number }[] = [
  { value: '2x2', label: '2×2', cells: 4 },
  { value: '2x3', label: '2×3', cells: 6 },
  { value: '3x2', label: '3×2', cells: 6 },
  { value: '3x3', label: '3×3', cells: 9 },
  { value: '3x4', label: '3×4', cells: 12 },
  { value: '4x3', label: '4×3', cells: 12 },
  { value: '4x4', label: '4×4', cells: 16 },
];

// Load image from URL or blob
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

// Slice a sprite sheet into individual images
export async function sliceSpriteSheet(options: SliceOptions): Promise<SliceResult[]> {
  const { grid, sourceImage, outputFormat = 'image/png', quality = 0.92 } = options;
  const { rows, cols } = parseGrid(grid);
  
  // Load image if it's a string URL
  const img = typeof sourceImage === 'string' 
    ? await loadImage(sourceImage) 
    : sourceImage;
  
  const cellWidth = Math.floor(img.width / cols);
  const cellHeight = Math.floor(img.height / rows);
  
  const results: SliceResult[] = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const canvas = document.createElement('canvas');
      canvas.width = cellWidth;
      canvas.height = cellHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      
      // Draw the portion of the sprite sheet onto this canvas
      ctx.drawImage(
        img,
        col * cellWidth,   // source x
        row * cellHeight,  // source y
        cellWidth,         // source width
        cellHeight,        // source height
        0,                 // dest x
        0,                 // dest y
        cellWidth,         // dest width
        cellHeight         // dest height
      );
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
          outputFormat,
          quality
        );
      });
      
      const dataUrl = canvas.toDataURL(outputFormat, quality);
      
      results.push({
        id: `slice-${Date.now()}-${row}-${col}-${Math.random().toString(36).substr(2, 6)}`,
        name: `Frame ${row * cols + col + 1}`,
        blob,
        dataUrl,
        row,
        col,
        width: cellWidth,
        height: cellHeight,
      });
    }
  }
  
  return results;
}

// Preview grid overlay positions (for UI)
export function getGridPreview(
  imageWidth: number, 
  imageHeight: number, 
  grid: SpliceGrid
): { x: number; y: number; width: number; height: number }[] {
  const { rows, cols } = parseGrid(grid);
  const cellWidth = imageWidth / cols;
  const cellHeight = imageHeight / rows;
  
  const cells: { x: number; y: number; width: number; height: number }[] = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({
        x: col * cellWidth,
        y: row * cellHeight,
        width: cellWidth,
        height: cellHeight,
      });
    }
  }
  
  return cells;
}
