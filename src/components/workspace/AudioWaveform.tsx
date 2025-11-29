import { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface AudioWaveformProps {
  audioUrl?: string;
  width: number;
  height?: number;
  className?: string;
  isPlaying?: boolean;
  playheadProgress?: number; // 0-1
}

// Generate waveform data from audio or create placeholder
export function AudioWaveform({
  audioUrl,
  width,
  height = 32,
  className,
  isPlaying = false,
  playheadProgress = 0,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const animationRef = useRef<number>();
  const phaseRef = useRef(0);

  // Generate placeholder waveform if no audio URL
  const placeholderWaveform = useMemo(() => {
    const bars = Math.max(20, Math.floor(width / 4));
    return Array.from({ length: bars }, (_, i) => {
      // Create a more natural-looking waveform pattern
      const base = Math.sin(i * 0.3) * 0.3 + 0.5;
      const noise = Math.sin(i * 1.7) * 0.2;
      const peaks = Math.sin(i * 0.1) * 0.3;
      return Math.min(1, Math.max(0.1, base + noise + peaks));
    });
  }, [width]);

  // Analyze audio and extract waveform data
  useEffect(() => {
    if (!audioUrl) {
      setWaveformData(placeholderWaveform);
      return;
    }

    const analyzeAudio = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get the raw PCM data
        const rawData = audioBuffer.getChannelData(0);
        const samples = Math.floor(width / 3); // One bar every 3 pixels
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];

        for (let i = 0; i < samples; i++) {
          const blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j] || 0);
          }
          filteredData.push(sum / blockSize);
        }

        // Normalize the data
        const maxVal = Math.max(...filteredData);
        const normalizedData = filteredData.map(val => val / maxVal);
        
        setWaveformData(normalizedData);
        audioContext.close();
      } catch (error) {
        console.warn('Failed to analyze audio, using placeholder:', error);
        setWaveformData(placeholderWaveform);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeAudio();
  }, [audioUrl, width, placeholderWaveform]);

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      const barWidth = Math.max(1, (width / waveformData.length) * 0.7);
      const gap = (width / waveformData.length) * 0.3;
      const centerY = height / 2;

      waveformData.forEach((value, i) => {
        const x = i * (barWidth + gap);
        const barHeight = value * (height * 0.8);
        
        // Determine if this bar is before or after the playhead
        const barProgress = i / waveformData.length;
        const isPlayed = barProgress < playheadProgress;
        
        // Animation effect when playing
        let animatedHeight = barHeight;
        if (isPlaying && !audioUrl) {
          // Add subtle animation for placeholder waveform
          const wave = Math.sin(phaseRef.current + i * 0.3) * 0.1;
          animatedHeight = barHeight * (1 + wave);
        }

        // Draw bar (mirrored from center)
        const halfHeight = animatedHeight / 2;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(x, centerY - halfHeight, x, centerY + halfHeight);
        if (isPlayed) {
          gradient.addColorStop(0, 'rgba(34, 197, 94, 0.9)'); // green-500
          gradient.addColorStop(1, 'rgba(34, 197, 94, 0.5)');
        } else {
          gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
          gradient.addColorStop(1, 'rgba(34, 197, 94, 0.2)');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, centerY - halfHeight, barWidth, halfHeight * 2, 1);
        ctx.fill();
      });
    };

    draw();

    // Animation loop for playing state
    if (isPlaying && !audioUrl) {
      const animate = () => {
        phaseRef.current += 0.1;
        draw();
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [waveformData, width, height, isPlaying, playheadProgress, audioUrl]);

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className={cn(
          "block",
          isLoading && "opacity-50"
        )}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// Simplified static waveform for timeline clips
export function StaticWaveform({ width, height = 24 }: { width: number; height?: number }) {
  const bars = Math.max(10, Math.floor(width / 6));
  
  return (
    <div className="flex items-center justify-center h-full gap-[1px]">
      {Array.from({ length: bars }).map((_, i) => {
        const barHeight = Math.sin(i * 0.5) * 0.3 + 0.5 + Math.sin(i * 1.3) * 0.2;
        return (
          <div
            key={i}
            className="bg-green-400/60 rounded-full"
            style={{
              width: 2,
              height: `${Math.max(20, barHeight * 100)}%`,
            }}
          />
        );
      })}
    </div>
  );
}
