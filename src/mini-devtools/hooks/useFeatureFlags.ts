import { useState, useEffect } from 'react';
import { FeatureFlags } from '../types';

// Mock feature flags - in production, fetch from Supabase feature_flags table
const mockFlags: FeatureFlags = {
  devtools_enabled: true,
  devtools_panels: undefined, // undefined = all panels enabled
  devtools_position: 'bottom-right',
};

export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(mockFlags);

  useEffect(() => {
    // In production:
    // const { data } = await supabase.from('feature_flags').select('*').eq('app_id', appId);
    // setFlags(transformFlags(data));
    
    setFlags(mockFlags);
  }, []);

  return flags;
}
