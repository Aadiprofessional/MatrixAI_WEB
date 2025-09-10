-- Migration: Add role column to chats table
-- This adds a role column to store the selected AI role for each chat

ALTER TABLE public.chats 
ADD COLUMN role text NULL DEFAULT 'assistant';

-- Add comment to describe the role column
COMMENT ON COLUMN public.chats.role IS 'The AI role/persona selected for this chat (e.g., assistant, teacher, developer, etc.)';

-- Create index for better performance when filtering by role
CREATE INDEX idx_chats_role ON public.chats(role);

-- Update existing chats to have default role
UPDATE public.chats 
SET role = 'assistant' 
WHERE role IS NULL;