-- Migration script to add file attachment support to messages table
-- This will allow storing file URLs, names, types, and sizes directly with messages

-- Add file attachment columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Add comments to explain the column purposes
COMMENT ON COLUMN public.messages.file_url IS 'URL of the attached file (e.g., from Supabase Storage)';
COMMENT ON COLUMN public.messages.file_name IS 'Original name of the attached file';
COMMENT ON COLUMN public.messages.file_type IS 'MIME type of the attached file (e.g., image/jpeg, application/pdf)';
COMMENT ON COLUMN public.messages.file_size IS 'Size of the attached file in bytes';

-- Create index for better query performance on file attachments
CREATE INDEX IF NOT EXISTS idx_messages_file_url 
ON public.messages (file_url) WHERE file_url IS NOT NULL;

-- Create index for file type queries
CREATE INDEX IF NOT EXISTS idx_messages_file_type 
ON public.messages (file_type) WHERE file_type IS NOT NULL;

-- Example of how messages with attachments will look:
-- {
--   "id": "b072ad7b-02d8-4d31-9780-54b2bc47ef70",
--   "chat_id": "2403a032-e287-41bf-be34-5f78a5294762",
--   "role": "user",
--   "content": "Here is an image I want to share with you.",
--   "file_url": "https://example.com/test-image.jpg",
--   "file_name": "test-image.jpg",
--   "file_type": "image/jpeg",
--   "file_size": 1024000
-- }