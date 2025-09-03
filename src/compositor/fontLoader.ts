import { FontSpec } from './TemplateSpec';

const loadedFonts = new Set<string>();

export async function loadFont(fontSpec: FontSpec): Promise<void> {
  const fontKey = `${fontSpec.family}-${fontSpec.weight || 'normal'}-${fontSpec.style || 'normal'}`;
  
  if (loadedFonts.has(fontKey)) {
    return;
  }

  try {
    // Check if font is already available
    if (document.fonts.check(`${fontSpec.size}px ${fontSpec.family}`)) {
      loadedFonts.add(fontKey);
      return;
    }

    // Load Google Font if needed
    await loadGoogleFont(fontSpec);
    loadedFonts.add(fontKey);
  } catch (error) {
    console.warn(`Failed to load font ${fontSpec.family}:`, error);
    // Fallback to system fonts
  }
}

async function loadGoogleFont(fontSpec: FontSpec): Promise<void> {
  const fontFamily = fontSpec.family.replace(/\s+/g, '+');
  const weights = fontSpec.weight ? [fontSpec.weight] : ['400'];
  const styles = fontSpec.style === 'italic' ? ['italic'] : ['normal'];
  
  // Build Google Fonts URL
  const weightStr = weights.join(',');
  const styleStr = styles.includes('italic') ? `:ital,wght@0,${weightStr};1,${weightStr}` : `:wght@${weightStr}`;
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily}${styleStr}&display=swap`;

  // Check if already loaded
  const existingLink = document.querySelector(`link[href*="${fontFamily}"]`);
  if (existingLink) {
    return;
  }

  // Create and append link element
  const link = document.createElement('link');
  link.href = fontUrl;
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  // Wait for font to load
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Font load timeout'));
    }, 5000);

    const checkFont = () => {
      if (document.fonts.check(`${fontSpec.size}px ${fontSpec.family}`)) {
        clearTimeout(timeout);
        resolve();
      } else {
        setTimeout(checkFont, 100);
      }
    };

    checkFont();
  });
}

export function getFontString(fontSpec: FontSpec): string {
  const parts = [];
  
  if (fontSpec.style && fontSpec.style !== 'normal') {
    parts.push(fontSpec.style);
  }
  
  if (fontSpec.variant && fontSpec.variant !== 'normal') {
    parts.push(fontSpec.variant);
  }
  
  if (fontSpec.weight && fontSpec.weight !== 'normal') {
    parts.push(fontSpec.weight);
  }
  
  parts.push(`${fontSpec.size}px`);
  parts.push(fontSpec.family);
  
  return parts.join(' ');
}