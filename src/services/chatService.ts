import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Types for the new chat structure
export interface ChatMessage {
  message_id: string;
  chat_id: string;
  sender_type: 'user' | 'assistant' | 'system';
  message_number: number;
  content_type: 'text' | 'image' | 'code' | 'markdown' | 'json';
  content: any;
  created_at: string;
  metadata?: any;
}

export interface Chat {
  chat_id: string;
  user_id: string;
  title: string;
  type: string;
  created_at: string;
  updated_at: string;
}

// Function to create a new chat
export const createChat = async (userId: string, title: string = 'New Chat', type: string = 'text'): Promise<Chat | null> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: userId,
        title,
        type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createChat:', error);
    return null;
  }
};

// Function to get all chats for a user
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching chats:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserChats:', error);
    return [];
  }
};

// Function to get a specific chat
export const getChat = async (chatId: string): Promise<Chat | null> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('chat_id', chatId)
      .single();

    if (error) {
      console.error('Error fetching chat:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getChat:', error);
    return null;
  }
};

// Function to update a chat
export const updateChat = async (chatId: string, updates: Partial<Chat>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chats')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('chat_id', chatId);

    if (error) {
      console.error('Error updating chat:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateChat:', error);
    return false;
  }
};

// Function to delete a chat
export const deleteChat = async (chatId: string): Promise<boolean> => {
  try {
    // Delete all messages first (should cascade, but being explicit)
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('chat_id', chatId);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return false;
    }

    // Then delete the chat
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('chat_id', chatId);

    if (error) {
      console.error('Error deleting chat:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteChat:', error);
    return false;
  }
};

// Function to get messages for a chat
export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('message_number', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getChatMessages:', error);
    return [];
  }
};

// Function to add a message to a chat
export const addMessage = async (
  chatId: string,
  senderType: 'user' | 'assistant' | 'system',
  contentType: 'text' | 'image' | 'code' | 'markdown' | 'json',
  content: any,
  metadata: any = {}
): Promise<ChatMessage | null> => {
  try {
    // Format content based on content type
    let formattedContent;
    
    switch (contentType) {
      case 'text':
        formattedContent = { text: content };
        break;
      case 'image':
        formattedContent = { 
          url: content.url || content, 
          caption: content.caption || '' 
        };
        break;
      case 'code':
        formattedContent = { 
          language: content.language || 'text', 
          code: content.code || content 
        };
        break;
      case 'markdown':
        formattedContent = { markdown: content };
        break;
      case 'json':
        formattedContent = content;
        break;
      default:
        formattedContent = { text: content };
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_type: senderType,
        content_type: contentType,
        content: formattedContent,
        metadata,
        created_at: new Date().toISOString(),
        message_number: 0 // This will be set by the trigger
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding message:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in addMessage:', error);
    return null;
  }
};

// Function to convert old message format to new format
export const convertOldMessageToNew = (oldMessage: any): any => {
  // Determine content type
  let contentType = 'text';
  let content: any = { text: oldMessage.content || oldMessage.text || '' };
  
  // Check if it's an image message
  if (oldMessage.fileContent && (
    oldMessage.fileName === 'Image' || 
    (oldMessage.fileContent.includes && oldMessage.fileContent.includes('supabase.co/storage/v1/'))
  )) {
    contentType = 'image';
    content = {
      url: oldMessage.fileContent,
      caption: oldMessage.content || ''
    };
  }
  
  // Check if it's a code message (simple heuristic)
  if (oldMessage.content && oldMessage.content.includes('```')) {
    const codeMatch = oldMessage.content.match(/```(\w*)([\s\S]*?)```/);
    if (codeMatch) {
      contentType = 'code';
      content = {
        language: codeMatch[1] || 'text',
        code: codeMatch[2].trim()
      };
    }
  }
  
  return {
    sender_type: oldMessage.role === 'assistant' ? 'assistant' : 'user',
    content_type: contentType,
    content: content,
    metadata: {}
  };
};

// Function to migrate old chat to new format
export const migrateOldChat = async (oldChat: any): Promise<string | null> => {
  try {
    // Create new chat
    const newChat = await createChat(
      oldChat.user_id,
      oldChat.title || oldChat.name || 'Migrated Chat',
      'text'
    );
    
    if (!newChat) {
      throw new Error('Failed to create new chat');
    }
    
    // Add messages
    if (oldChat.messages && Array.isArray(oldChat.messages)) {
      for (const oldMessage of oldChat.messages) {
        const newMessageData = convertOldMessageToNew(oldMessage);
        await addMessage(
          newChat.chat_id,
          newMessageData.sender_type,
          newMessageData.content_type,
          newMessageData.content,
          newMessageData.metadata
        );
      }
    }
    
    return newChat.chat_id;
  } catch (error) {
    console.error('Error migrating old chat:', error);
    return null;
  }
};