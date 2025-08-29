-- Fix security vulnerability: Remove anonymous access to AI operations
-- This prevents unauthorized users from viewing AI operations with NULL user_id

-- Drop the existing insecure policy
DROP POLICY IF EXISTS "Users can view their own operations" ON public.ai_operations;

-- Create a secure policy that only allows authenticated users to view their own operations
CREATE POLICY "Users can view their own operations" 
ON public.ai_operations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Also ensure the user_id column should not be nullable for new operations
-- (keeping existing NULL values but encouraging proper user association)
COMMENT ON COLUMN public.ai_operations.user_id IS 'Should be set to auth.uid() for all new operations to ensure proper access control';