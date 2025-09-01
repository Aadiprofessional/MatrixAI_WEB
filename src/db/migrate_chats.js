// Migration script to move data from old chat structure to new structure
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateChats() {
  console.log('Starting chat migration...');
  
  try {
    // 1. Get all chats from the old table
    const { data: oldChats, error: fetchError } = await supabase
      .from('user_chats')
      .select('*');
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`Found ${oldChats.length} chats to migrate`);
    
    // 2. For each old chat, create a new chat and messages
    for (const oldChat of oldChats) {
      try {
        // Create new chat
        const { data: newChat, error: chatError } = await supabase
          .from('chats')
          .insert({
            user_id: oldChat.user_id,
            title: oldChat.name || oldChat.title || 'Migrated Chat',
            type: 'text',
            created_at: oldChat.created_at,
            updated_at: oldChat.updated_at
          })
          .select()
          .single();
        
        if (chatError) {
          console.error(`Error creating new chat for ${oldChat.chat_id}:`, chatError);
          continue;
        }
        
        console.log(`Created new chat ${newChat.chat_id} for old chat ${oldChat.chat_id}`);
        
        // Process messages
        if (oldChat.messages && Array.isArray(oldChat.messages)) {
          for (let i = 0; i < oldChat.messages.length; i++) {
            const oldMessage = oldChat.messages[i];
            
            // Determine message type and content
            let contentType = 'text';
            let content = { text: oldMessage.text || oldMessage.content || '' };
            
            // Check if it's an image message
            if (oldMessage.attachment || oldMessage.fileContent) {
              contentType = 'image';
              content = {
                url: oldMessage.attachment?.url || oldMessage.fileContent || '',
                caption: oldMessage.text || oldMessage.content || ''
              };
            }
            
            // Insert new message
            const { error: messageError } = await supabase
              .from('messages')
              .insert({
                chat_id: newChat.chat_id,
                sender_type: oldMessage.role === 'assistant' || oldMessage.sender === 'bot' ? 'assistant' : 'user',
                message_number: i + 1,
                content_type: contentType,
                content: content,
                created_at: oldMessage.timestamp || oldChat.created_at,
                metadata: {}
              });
            
            if (messageError) {
              console.error(`Error creating message for chat ${newChat.chat_id}:`, messageError);
            }
          }
          
          console.log(`Migrated ${oldChat.messages.length} messages for chat ${newChat.chat_id}`);
        }
      } catch (chatError) {
        console.error(`Error processing chat ${oldChat.chat_id}:`, chatError);
      }
    }
    
    console.log('Migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateChats();