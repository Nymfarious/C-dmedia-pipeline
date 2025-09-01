-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-videos', 'ai-videos', true);

-- Create RLS policies for video bucket
CREATE POLICY "Videos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ai-videos');

CREATE POLICY "Users can upload videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ai-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'ai-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'ai-videos' AND auth.role() = 'authenticated');