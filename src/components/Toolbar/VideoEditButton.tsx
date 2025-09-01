import React from 'react';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import useAppStore from '@/store/appStore';
import { Asset } from '@/types/media';

interface VideoEditButtonProps {
  asset?: Asset;
  className?: string;
}

export function VideoEditButton({ asset, className }: VideoEditButtonProps) {
  const { setActiveTool } = useAppStore();

  const handleVideoEdit = () => {
    if (asset?.type === 'video') {
      setActiveTool('video-edit');
    }
  };

  const isDisabled = !asset || asset.type !== 'video';

  return (
    <Button
      onClick={handleVideoEdit}
      disabled={isDisabled}
      variant="outline"
      size="sm"
      className={className}
      title={isDisabled ? 'Select a video to edit' : 'Edit video with AI'}
    >
      <Wand2 className="h-4 w-4 mr-2" />
      Edit Video
    </Button>
  );
}