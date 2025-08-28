export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function fetchBlobFromUrl(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  return response.blob();
}

export function getFileExtensionFromBlob(blob: Blob): string {
  const mimeType = blob.type;
  switch (mimeType) {
    case 'image/png': return 'png';
    case 'image/jpeg': return 'jpg';
    case 'image/gif': return 'gif';
    case 'image/webp': return 'webp';
    case 'video/mp4': return 'mp4';
    case 'video/webm': return 'webm';
    case 'audio/mp3': return 'mp3';
    case 'audio/wav': return 'wav';
    case 'audio/ogg': return 'ogg';
    default: return 'bin';
  }
}