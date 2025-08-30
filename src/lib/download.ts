/**
 * Download an asset from a URL to the user's device
 */
export async function downloadAsset(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch asset: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

/**
 * Download a blob directly to the user's device
 */
export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const downloadUrl = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the object URL
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Fetch a blob from a URL
 */
export async function fetchBlobFromUrl(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch from URL: ${response.statusText}`);
  }
  return response.blob();
}

/**
 * Get file extension from blob type
 */
export function getFileExtensionFromBlob(blob: Blob): string {
  const mimeType = blob.type;
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'video/mp4':
      return 'mp4';
    case 'audio/wav':
      return 'wav';
    case 'audio/mp3':
      return 'mp3';
    default:
      return 'bin';
  }
}