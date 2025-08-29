-- Create storage buckets for AI assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('ai-images', 'ai-images', true, 52428800, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('ai-masks', 'ai-masks', false, 10485760, ARRAY['image/png'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for AI images bucket (public read)
CREATE POLICY "AI images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ai-images');

CREATE POLICY "Anyone can upload AI images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ai-images');

CREATE POLICY "Anyone can update AI images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'ai-images');

-- Create RLS policies for AI masks bucket (private)
CREATE POLICY "Users can view their own masks" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ai-masks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own masks" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ai-masks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own masks" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'ai-masks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create AI operations tracking table
CREATE TABLE IF NOT EXISTS public.ai_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  operation_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_params JSONB NOT NULL,
  output_asset_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  job_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on AI operations
ALTER TABLE public.ai_operations ENABLE ROW LEVEL SECURITY;

-- Create policies for AI operations
CREATE POLICY "Users can view their own operations" 
ON public.ai_operations 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can create operations" 
ON public.ai_operations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update operations" 
ON public.ai_operations 
FOR UPDATE 
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_operations_user_id ON public.ai_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_operations_status ON public.ai_operations(status);
CREATE INDEX IF NOT EXISTS idx_ai_operations_job_id ON public.ai_operations(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_operations_created_at ON public.ai_operations(created_at);