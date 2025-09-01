import { Asset } from './media';

export interface VideoEditParams {
  prompt?: string;
  instruction?: string;
  motionStrength?: number;
  structureStrength?: number;
  seed?: number;
  numFrames?: number;
  fps?: number;
  aspectRatio?: string;
}

export interface VideoEditAdapter {
  key: string;
  edit(asset: Asset, params: VideoEditParams): Promise<Asset>;
}