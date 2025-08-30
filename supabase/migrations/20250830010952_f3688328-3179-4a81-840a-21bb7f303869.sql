-- Fix security vulnerability: Restrict UPDATE operations on ai_operations to operation owner only
DROP POLICY IF EXISTS "Anyone can update operations" ON public.ai_operations;

CREATE POLICY "Users can update their own operations" 
ON public.ai_operations 
FOR UPDATE 
USING (auth.uid() = user_id);