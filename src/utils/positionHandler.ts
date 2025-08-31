// Utility for handling position parameters in text overlays
export function getPositionCoordinates(position: string | { x: number; y: number }): { x: number; y: number } {
  if (typeof position === 'object' && position.x !== undefined && position.y !== undefined) {
    return { x: position.x, y: position.y };
  }
  
  // Default positions for string values
  const stringPosition = position as string;
  switch (stringPosition) {
    case 'top-left':
      return { x: 50, y: 50 };
    case 'top-center':
      return { x: 250, y: 50 };
    case 'top-right':
      return { x: 450, y: 50 };
    case 'center-left':
      return { x: 50, y: 250 };
    case 'center':
      return { x: 250, y: 250 };
    case 'center-right':
      return { x: 450, y: 250 };
    case 'bottom-left':
      return { x: 50, y: 450 };
    case 'bottom-center':
      return { x: 250, y: 450 };
    case 'bottom-right':
      return { x: 450, y: 450 };
    default:
      return { x: 250, y: 250 }; // Default center
  }
}