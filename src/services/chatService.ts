import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Interface for the new message structure
export interface SupabaseMessage {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'pending' | 'streaming' | 'done';
  position: number;
  created_at: string;
  metadata?: any;
  external_ref?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
}

// Interface for chat structure
export interface SupabaseChat {
  id: string;
  owner: string;
  title: string;
  created_at: string;
  position_counter: number;
  metadata?: any;
  role?: string;
}

// Legacy interfaces for backward compatibility
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
  role: string;
  role_description?: string;
  created_at: string;
  updated_at: string;
}

// Frontend message format
export interface FrontendMessage {
  message_id?: string;
  chat_id?: string;
  sender_type?: 'user' | 'assistant' | 'system';
  role: string;
  content: string;
  timestamp: string;
  content_type?: 'text' | 'image' | 'code' | 'markdown' | 'json';
  fileContent?: string;
  fileName?: string;
  isStreaming?: boolean;
  attachments?: {
    url: string;
    fileName: string;
    fileType: string;
    originalName?: string;
    size?: number;
  }[];
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  chartConfig?: any;
  chartId?: string;
  equation?: string;
}

// Convert frontend message format to database format
export const messageToDbFormat = (message: FrontendMessage, chatId: string): Partial<ChatMessage> => {
  let contentObj: any = {};
  let contentType: 'text' | 'image' | 'code' | 'markdown' | 'json' = 'text';
  
  // Handle different message types
  if (message.fileContent) {
    // Image or file attachment
    contentObj = {
      url: message.fileContent,
      caption: message.content || message.fileName || ''
    };
    contentType = 'image';
  } else if (message.content && message.content.includes('```')) {
    // Code block
    contentObj = {
      text: message.content,
      language: 'markdown'
    };
    contentType = 'code';
  } else {
    // Regular text
    contentObj = {
      text: message.content
    };
    contentType = 'text';
  }
  
  return {
    chat_id: chatId,
    sender_type: message.role === 'user' ? 'user' : message.role === 'system' ? 'system' : 'assistant',
    content_type: contentType,
    content: contentObj,
    created_at: message.timestamp || new Date().toISOString(),
    metadata: {}
  };
};

// Convert database message format to frontend format
export const dbMessageToFrontend = (dbMessage: ChatMessage): FrontendMessage => {
  const { message_id, chat_id, sender_type, content_type, content, created_at } = dbMessage;
  
  let frontendMessage: FrontendMessage = {
    message_id: message_id,
    chat_id: chat_id,
    sender_type: sender_type,
    role: sender_type,
    content: '',
    content_type: content_type,
    timestamp: created_at
  };
  
  // Handle different content types
  if (content_type === 'text') {
    frontendMessage.content = content.text || '';
  } else if (content_type === 'image') {
    frontendMessage.content = content.caption || '';
    frontendMessage.fileContent = content.url || '';
    frontendMessage.fileName = 'Image';
  } else if (content_type === 'code') {
    frontendMessage.content = content.text || '';
  } else if (content_type === 'markdown') {
    frontendMessage.content = content.text || '';
  } else if (content_type === 'json') {
    frontendMessage.content = JSON.stringify(content, null, 2);
  }
  
  return frontendMessage;
}

// Create a new chat
export const createChat = async (userId: string, title: string = 'New Chat', type: string = 'text', role: string = 'general', roleDescription: string = ''): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: userId,
        title: title,
        type: type,
        role: role,
        role_description: roleDescription
      })
      .select('chat_id')
      .single();
    
    if (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createChat:', error);
    throw error;
  }
};

// Get all chats for a user
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user chats:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getUserChats:', error);
    return [];
  }
};

// Get a specific chat by ID
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

// Function to add a frontend message to a chat
export const addFrontendMessage = async (chatId: string, message: FrontendMessage): Promise<boolean> => {
  try {
    // Convert frontend message to DB format
    const dbMessage = messageToDbFormat(message, chatId);
    
    // Insert the new message directly into the messages table
    const { error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_type: dbMessage.sender_type || 'user',
        content_type: dbMessage.content_type || 'text',
        content: dbMessage.content,
        metadata: dbMessage.metadata || {}
      });
    
    if (error) {
      console.error('Error adding message:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in addMessage:', error);
    return false;
  }
};

// Function to get messages for a chat
export const getChatMessages = async (chatId: string): Promise<FrontendMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('message_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
    
    // Convert database messages to frontend format
    return data ? data.map(dbMessageToFrontend) : [];
  } catch (error) {
    console.error('Error in getChatMessages:', error);
    return [];
  }
};

// Update a chat
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

// Function to add a message with detailed parameters
export const addMessageDetailed = async (
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
        await addMessageDetailed(
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

// ===== NEW SUPABASE FUNCTIONS =====

// Create a new chat using the new structure
export const createNewChat = async (userId: string, title: string = 'New Chat', metadata: any = {}, role: string = 'assistant'): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        owner: userId,
        title,
        metadata,
        role
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating chat:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createNewChat:', error);
    return null;
  }
};

// Add a user message to a chat
export const addUserMessage = async (
  chatId: string,
  userId: string,
  content: string,
  metadata: any = {},
  externalRef?: string
): Promise<SupabaseMessage | null> => {
  try {
    const { data, error } = await supabase
      .rpc('add_user_message', {
        p_chat: chatId,
        p_user: userId,
        p_content: content,
        p_metadata: metadata,
        p_external_ref: externalRef
      });

    if (error) {
      console.error('Error adding user message:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in addUserMessage:', error);
    return null;
  }
};

// Add user message with file attachment support
export const addUserMessageWithAttachment = async (
  chatId: string,
  userId: string,
  content: string,
  fileUrl?: string,
  fileName?: string,
  fileType?: string,
  fileSize?: number,
  metadata: any = {},
  externalRef?: string
): Promise<SupabaseMessage | null> => {
  try {
    // For now, we'll use direct insert since we don't have the RPC function yet
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role: 'user',
        content: content,
        status: 'done',
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        metadata: metadata,
        external_ref: externalRef
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding user message with attachment:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in addUserMessageWithAttachment:', error);
    return null;
  }
};

// Start an assistant message
export const startAssistantMessage = async (
  chatId: string,
  userId: string,
  metadata: any = {},
  externalRef?: string
): Promise<SupabaseMessage | null> => {
  try {
    const { data, error } = await supabase
      .rpc('start_assistant_message', {
        p_chat: chatId,
        p_user: userId,
        p_metadata: metadata,
        p_external_ref: externalRef
      });

    if (error) {
      console.error('Error starting assistant message:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in startAssistantMessage:', error);
    return null;
  }
};

// Append a chunk to an assistant message
export const appendMessageChunk = async (
  messageId: string,
  chunk: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .rpc('append_message_chunk', {
        p_message: messageId,
        p_chunk: chunk
      });

    if (error) {
      console.error('Error appending message chunk:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in appendMessageChunk:', error);
    return false;
  }
};

// Finalize a message
export const finalizeMessage = async (messageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .rpc('finalize_message', {
        p_message: messageId
      });

    if (error) {
      console.error('Error finalizing message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in finalizeMessage:', error);
    return false;
  }
};

// Get all messages for a chat using new structure
export const getNewChatMessages = async (chatId: string): Promise<SupabaseMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getNewChatMessages:', error);
    return [];
  }
};

// Get chat messages with lazy loading support
export const getChatMessagesLazy = async (
  chatId: string, 
  limit: number = 10, 
  beforePosition?: number
): Promise<SupabaseMessage[]> => {
  try {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('position', { ascending: false })
      .limit(limit);

    // If beforePosition is provided, load messages before that position
    if (beforePosition !== undefined) {
      query = query.lt('position', beforePosition);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching chat messages with lazy loading:', error);
      return [];
    }

    // Reverse to get chronological order (oldest first)
    return (data || []).reverse();
  } catch (error) {
    console.error('Error in getChatMessagesLazy:', error);
    return [];
  }
};

// Get the latest messages for initial load
export const getLatestChatMessages = async (
  chatId: string, 
  limit: number = 10
): Promise<SupabaseMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('position', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching latest chat messages:', error);
      return [];
    }

    // Reverse to get chronological order (oldest first)
    return (data || []).reverse();
  } catch (error) {
    console.error('Error in getLatestChatMessages:', error);
    return [];
  }
};

// Get all chats for a user using new structure
export const getNewUserChats = async (userId: string): Promise<SupabaseChat[]> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('owner', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user chats:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getNewUserChats:', error);
    return [];
  }
};

// Delete a chat and all its messages using new structure
export const deleteNewChat = async (chatId: string, userId: string): Promise<boolean> => {
  try {
    // First delete all messages in the chat
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('chat_id', chatId);

    if (messagesError) {
      console.error('Error deleting chat messages:', messagesError);
      return false;
    }

    // Then delete the chat itself
    const { error: chatError } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('owner', userId);

    if (chatError) {
      console.error('Error deleting chat:', chatError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteNewChat:', error);
    return false;
  }
};

// Update chat title using new structure
export const updateNewChatTitle = async (chatId: string, userId: string, title: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chats')
      .update({ title })
      .eq('id', chatId)
      .eq('owner', userId);

    if (error) {
      console.error('Error updating chat title:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateNewChatTitle:', error);
    return false;
  }
};

// Update chat role
export const updateChatRole = async (chatId: string, userId: string, role: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chats')
      .update({ role })
      .eq('id', chatId)
      .eq('owner', userId);

    if (error) {
      console.error('Error updating chat role:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateChatRole:', error);
    return false;
  }
};

// Convert SupabaseMessage to FrontendMessage for compatibility
export const supabaseMessageToFrontend = (supabaseMessage: SupabaseMessage): FrontendMessage => {
  let content = supabaseMessage.content;
  let fileContent: string | undefined;
  let fileName: string | undefined;
  
  // Check for new ;;%%;; delimited URLs
  if (content && typeof content === 'string' && content.includes(';;%%;;')) {
    const urlMatch = content.match(/;;%%;;(.*?);;%%;;/);
    if (urlMatch) {
      fileContent = urlMatch[1].trim();
      content = content.replace(/;;%%;;.*?;;%%;;/g, '').trim();
      fileName = 'Attachment';
    }
  }
  
  // Create attachments array if file attachment data exists
  let attachments: { url: string; fileName: string; fileType: string; originalName?: string; size?: number; }[] | undefined;
  if (supabaseMessage.file_url) {
    attachments = [{
      url: supabaseMessage.file_url,
      fileName: supabaseMessage.file_name || 'Unknown',
      fileType: supabaseMessage.file_type || 'application/octet-stream',
      originalName: supabaseMessage.file_name,
      size: supabaseMessage.file_size
    }];
  }

  // Extract chart configuration from metadata if present
  let chartConfig: any = undefined;
  let chartId: string | undefined;
  let equation: string | undefined;
  
  if (supabaseMessage.metadata && supabaseMessage.metadata.chart) {
    chartConfig = supabaseMessage.metadata.chart.chartConfig;
    chartId = supabaseMessage.metadata.chart.chartId;
    equation = supabaseMessage.metadata.chart.equation;
  }
  
  return {
    message_id: supabaseMessage.id,
    chat_id: supabaseMessage.chat_id,
    sender_type: supabaseMessage.role,
    role: supabaseMessage.role,
    content: content,
    timestamp: supabaseMessage.created_at,
    content_type: 'text',
    isStreaming: supabaseMessage.status === 'streaming',
    fileContent: fileContent,
    fileName: fileName,
    attachments: attachments,
    file_url: supabaseMessage.file_url,
    file_name: supabaseMessage.file_name,
    file_type: supabaseMessage.file_type,
    file_size: supabaseMessage.file_size,
    chartConfig: chartConfig,
    chartId: chartId,
    equation: equation
  };
};