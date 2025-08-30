const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://ddtgdhehxhgarkonvpfq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdGdkaGVoeGhnYXJrb252cGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2Njg4MTIsImV4cCI6MjA1MDI0NDgxMn0.mY8nx-lKrNXjJxHU7eEja3-fTSELQotOP4aZbxvmNPY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addAttachmentsColumn() {
  try {
    console.log('Adding attachments column to user_chats table...');
    
    // Add attachments column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.user_chats 
        ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN public.user_chats.attachments IS 'Stores file attachments as array of objects with messageId, fileUrl, fileName, fileType';
        
        CREATE INDEX IF NOT EXISTS idx_user_chats_attachments 
        ON public.user_chats USING GIN (attachments);
      `
    });
    
    if (error) {
      console.error('Error adding attachments column:', error);
      return;
    }
    
    console.log('✅ Successfully added attachments column to user_chats table');
    console.log('Column structure: JSONB array storing file attachment metadata');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
addAttachmentsColumn();