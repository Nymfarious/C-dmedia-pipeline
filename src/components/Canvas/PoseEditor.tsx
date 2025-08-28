import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

interface PoseKeypoint {
  x: number;
  y: number;
  id: string;
  label: string;
}

interface PoseEditorProps {
  imageUrl?: string;
  onPoseAdjust: (keypoints: PoseKeypoint[]) => void;
  className?: string;
}

export const PoseEditor: React.FC<PoseEditorProps> = ({ 
  imageUrl, 
  onPoseAdjust, 
  className 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [keypoints, setKeypoints] = useState<PoseKeypoint[]>([]);
  const [selectedKeypoint, setSelectedKeypoint] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Standard OpenPose keypoints
  const defaultKeypoints: Omit<PoseKeypoint, 'x' | 'y'>[] = [
    { id: 'nose', label: 'Nose' },
    { id: 'neck', label: 'Neck' },
    { id: 'right_shoulder', label: 'Right Shoulder' },
    { id: 'right_elbow', label: 'Right Elbow' },
    { id: 'right_wrist', label: 'Right Wrist' },
    { id: 'left_shoulder', label: 'Left Shoulder' },
    { id: 'left_elbow', label: 'Left Elbow' },
    { id: 'left_wrist', label: 'Left Wrist' },
    { id: 'right_hip', label: 'Right Hip' },
    { id: 'right_knee', label: 'Right Knee' },
    { id: 'right_ankle', label: 'Right Ankle' },
    { id: 'left_hip', label: 'Left Hip' },
    { id: 'left_knee', label: 'Left Knee' },
    { id: 'left_ankle', label: 'Left Ankle' },
  ];

  useEffect(() => {
    if (imageUrl) {
      loadImageAndInitKeypoints();
    }
  }, [imageUrl]);

  const loadImageAndInitKeypoints = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      
      // Draw image
      ctx.drawImage(img, 0, 0, 512, 512);
      
      // Initialize keypoints at center positions
      const initialKeypoints: PoseKeypoint[] = defaultKeypoints.map((kp, index) => ({
        ...kp,
        x: 256 + (Math.random() - 0.5) * 200,
        y: 100 + (index * 25),
      }));
      
      setKeypoints(initialKeypoints);
      drawKeypoints(ctx, initialKeypoints);
    };
    
    if (imageUrl) {
      img.src = imageUrl;
    }
  };

  const drawKeypoints = (ctx: CanvasRenderingContext2D, kps: PoseKeypoint[]) => {
    kps.forEach((kp) => {
      ctx.fillStyle = selectedKeypoint === kp.id ? '#ff6b6b' : '#4ecdc4';
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw label
      ctx.fillStyle = '#2d3748';
      ctx.font = '12px Inter';
      ctx.fillText(kp.label, kp.x + 10, kp.y - 10);
    });
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    
    // Find clicked keypoint
    const clickedKeypoint = keypoints.find(kp => {
      const distance = Math.sqrt((kp.x - pos.x) ** 2 + (kp.y - pos.y) ** 2);
      return distance <= 10;
    });
    
    if (clickedKeypoint) {
      setSelectedKeypoint(clickedKeypoint.id);
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedKeypoint) return;
    
    const pos = getMousePos(e);
    const updatedKeypoints = keypoints.map(kp =>
      kp.id === selectedKeypoint ? { ...kp, x: pos.x, y: pos.y } : kp
    );
    
    setKeypoints(updatedKeypoints);
    
    // Redraw canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 512, 512);
        drawKeypoints(ctx, updatedKeypoints);
      };
      img.src = imageUrl;
    } else {
      drawKeypoints(ctx, updatedKeypoints);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setSelectedKeypoint(null);
  };

  const resetPose = () => {
    loadImageAndInitKeypoints();
  };

  const applyPose = () => {
    onPoseAdjust(keypoints);
  };

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pose Editor</h3>
        <Badge variant="secondary">OpenPose</Badge>
      </div>
      
      <div className="space-y-4">
        <canvas
          ref={canvasRef}
          className="border border-border rounded-lg cursor-crosshair w-full max-w-md mx-auto"
          style={{ aspectRatio: '1:1' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        <p className="text-sm text-muted-foreground text-center">
          Click and drag the keypoints to adjust the pose
        </p>
        
        <div className="flex gap-2 justify-center">
          <Button onClick={resetPose} variant="outline" size="sm">
            Reset Pose
          </Button>
          <Button onClick={applyPose} size="sm">
            Apply Pose
          </Button>
        </div>
      </div>
    </Card>
  );
};