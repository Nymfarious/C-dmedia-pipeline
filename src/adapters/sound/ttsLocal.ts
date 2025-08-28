import { SoundAdapter, SoundParams, Asset } from '@/types/media';

// Local TTS using Web Speech API
export const localTTS: SoundAdapter = {
  key: "tts.local",
  
  async addSound(target: Asset, params: SoundParams): Promise<Asset> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing
    
    if (params.ttsText) {
      // Use Web Speech API for TTS (if available)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(params.ttsText);
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        // Note: In a real implementation, we'd record the speech and create an audio blob
        // For now, we'll create a mock audio asset
      }
    }
    
    // Create a visual representation of the audio
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    
    // Draw waveform visualization
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw audio waveform
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let x = 0; x < canvas.width; x += 4) {
      const amplitude = Math.sin(x * 0.02) * Math.random() * 50;
      const y = canvas.height / 2 + amplitude;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Add audio info
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('🔊 AUDIO TRACK', canvas.width / 2, 40);
    
    if (params.ttsText) {
      ctx.font = '12px Inter';
      ctx.fillText(`"${params.ttsText.slice(0, 50)}..."`, canvas.width / 2, canvas.height - 20);
    }
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
    
    return {
      id: crypto.randomUUID(),
      type: 'audio',
      name: `Audio: ${target.name}`,
      src: URL.createObjectURL(blob),
      meta: { 
        ...target.meta,
        audioText: params.ttsText,
        duration: params.durationMs || 3000,
        provider: 'tts.local'
      },
      createdAt: Date.now(),
      derivedFrom: target.id,
    };
  }
};