import { LucideIcon } from 'lucide-react';
import { ComponentType } from 'react';

export interface AppMetadata {
  name: string;
  version: string;
  environment: 'dev' | 'staging' | 'production';
}

export interface CustomPanelConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  component: ComponentType;
}

export interface ApiRegistryEntry {
  id: string;
  name: string;
  vendor: string;
  category: string;
  status: 'planned' | 'testing' | 'live' | 'deprecated';
  auth_type: string;
  purpose?: string;
}

export interface MiniDevConfig {
  app: AppMetadata;
  panels?: string[]; // Subset of panel IDs to show (undefined = all)
  customPanels?: CustomPanelConfig[];
  apiRegistryFetch?: () => Promise<ApiRegistryEntry[]>;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export interface FeatureFlags {
  devtools_enabled: boolean;
  devtools_panels?: string[];
  devtools_position?: string;
}
