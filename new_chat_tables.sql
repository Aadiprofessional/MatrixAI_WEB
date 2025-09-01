-- First, drop the existing user_chats table
DROP TABLE IF EXISTS user_chats;

-- Create new Chats table
CREATE TABLE chats (
  chat_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  type VARCHAR(50) DEFAULT 'text',
  role VARCHAR(50) DEFAULT 'general',
  role_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add RLS policies
  CONSTRAINT chats_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create Messages table
CREATE TABLE messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'assistant', 'system')),
  message_number INT NOT NULL,
  content_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'code', 'markdown', 'json')),
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Add RLS policies
  CONSTRAINT messages_chat_id_fk FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Add RLS policies for chats table
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY chats_select_policy ON chats
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY chats_insert_policy ON chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY chats_update_policy ON chats
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY chats_delete_policy ON chats
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_select_policy ON messages
  FOR SELECT USING (
    chat_id IN (SELECT chat_id FROM chats WHERE user_id = auth.uid())
  );
  
CREATE POLICY messages_insert_policy ON messages
  FOR INSERT WITH CHECK (
    chat_id IN (SELECT chat_id FROM chats WHERE user_id = auth.uid())
  );
  
CREATE POLICY messages_update_policy ON messages
  FOR UPDATE USING (
    chat_id IN (SELECT chat_id FROM chats WHERE user_id = auth.uid())
  );
  
CREATE POLICY messages_delete_policy ON messages
  FOR DELETE USING (
    chat_id IN (SELECT chat_id FROM chats WHERE user_id = auth.uid())
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

-- Create trigger to update chat's timestamp
CREATE TRIGGER update_chat_timestamp_trigger
AFTER INSERT OR UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_timestamp();

-- Create function to automatically set message_number
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

-- Create trigger to set message_number
CREATE TRIGGER set_message_number_trigger
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION set_message_number();