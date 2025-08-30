-- Migration script to add attachments column to user_chats table
-- This column will store file attachments separately from messages

-- Add attachments column to store file information as JSONB
ALTER TABLE public.user_chats 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the column purpose
COMMENT ON COLUMN public.user_chats.attachments IS 'Stores file attachments as array of objects with messageId, fileUrl, fileName, fileType';

-- Create index for better query performance on attachments
CREATE INDEX IF NOT EXISTS idx_user_chats_attachments 
ON public.user_chats USING GIN (attachments);

-- Example structure for attachments:
-- [
--   {
--     "messageId": "unique_message_id",
--     "fileUrl": "https://supabase.co/storage/v1/...",
--     "fileName": "image.jpg",
--     "fileType": "image/jpeg",
--     "uploadedAt": "2024-01-20T10:30:00Z"
--   }
-- ]