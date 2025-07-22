-- SQL to create the transcription_chats table

CREATE TABLE transcription_chats (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, audio_id)
);

-- Add RLS policies for security

-- Enable RLS
ALTER TABLE transcription_chats ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own chats
CREATE POLICY "Users can view their own transcription chats" 
  ON transcription_chats 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own chats
CREATE POLICY "Users can insert their own transcription chats" 
  ON transcription_chats 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own chats
CREATE POLICY "Users can update their own transcription chats" 
  ON transcription_chats 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own chats
CREATE POLICY "Users can delete their own transcription chats" 
  ON transcription_chats 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_transcription_chats_user_id ON transcription_chats(user_id);
CREATE INDEX idx_transcription_chats_audio_id ON transcription_chats(audio_id);
CREATE INDEX idx_transcription_chats_created_at ON transcription_chats(created_at);