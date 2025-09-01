-- Drop existing chat table
DROP TABLE IF EXISTS user_chats;

-- Create new chat type enum
CREATE TYPE chat_type AS ENUM ('text', 'code', 'image');

-- Create new sender type enum
CREATE TYPE sender_type AS ENUM ('user', 'assistant', 'system');

-- Create new content type enum
CREATE TYPE content_type AS ENUM ('text', 'image', 'code', 'markdown', 'json');

-- Create Chats table
CREATE TABLE chats (
  chat_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  type chat_type DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Messages table
CREATE TABLE messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_type sender_type NOT NULL,
  message_number INT NOT NULL,
  content_type content_type NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index on chat_id for faster message retrieval
CREATE INDEX idx_messages_chat_id ON messages(chat_id);

-- Create index on user_id for faster chat retrieval
CREATE INDEX idx_chats_user_id ON chats(user_id);

-- Set up Row Level Security (RLS)
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chats
CREATE POLICY "Users can view their own chats" 
  ON chats FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chats" 
  ON chats FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats" 
  ON chats FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats" 
  ON chats FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for messages
CREATE POLICY "Users can view messages in their chats" 
  ON messages FOR SELECT 
  USING (
    chat_id IN (
      SELECT chat_id FROM chats WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their chats" 
  ON messages FOR INSERT 
  WITH CHECK (
    chat_id IN (
      SELECT chat_id FROM chats WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their chats" 
  ON messages FOR UPDATE 
  USING (
    chat_id IN (
      SELECT chat_id FROM chats WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in their chats" 
  ON messages FOR DELETE 
  USING (
    chat_id IN (
      SELECT chat_id FROM chats WHERE user_id = auth.uid()
    )
  );

-- Create function to update chat's updated_at timestamp when a message is added
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats
  SET updated_at = NOW()
  WHERE chat_id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update chat's updated_at timestamp
CREATE TRIGGER update_chat_timestamp_trigger
AFTER INSERT OR UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_timestamp();

-- Create function to set message_number automatically
CREATE OR REPLACE FUNCTION set_message_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.message_number := (
    SELECT COALESCE(MAX(message_number), 0) + 1
    FROM messages
    WHERE chat_id = NEW.chat_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set message_number automatically
CREATE TRIGGER set_message_number_trigger
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION set_message_number();