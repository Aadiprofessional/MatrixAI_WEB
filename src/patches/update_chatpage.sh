#!/bin/bash

# This script updates ChatPage.tsx to use the new chat service

# Path to the file
FILE_PATH="/Users/aadisrivastava/Downloads/project/MatrixAI/MatrixAI_Web/aiagent/src/pages/ChatPage.tsx"

# Create a backup
cp "$FILE_PATH" "${FILE_PATH}.bak"

# Replace the saveChatToDatabase function
cat > /tmp/new_save_function.txt << 'EOL'
  // Save chat message to database
  const saveChatToDatabase = async (messageContent: string | any, role: string) => {
    try {
      // Use AuthContext user for database operations
      if (!user?.uid) {
        console.log('No authenticated user, skipping database save');
        return;
      }
      
      const userId = user.uid;
      console.log('Using AuthContext user ID for database save:', userId);
      
      // Handle both string and structured message formats
      const isStructuredMessage = typeof messageContent === 'object' && messageContent !== null;
      
      console.log('💾 saveChatToDatabase called:', {
        role,
        isStructuredMessage,
        messageType: typeof messageContent,
        hasAttachment: isStructuredMessage && messageContent.attachment,
        preview: isStructuredMessage ? messageContent.text?.substring(0, 100) : messageContent?.substring(0, 100)
      });
      
      // Parse message content to separate text and image data
      let textContent;
      let imageData = null;
      
      if (isStructuredMessage) {
        // Handle new structured format
        textContent = messageContent.text || '';
        if (messageContent.attachment) {
          imageData = messageContent.attachment;
        }
      } else {
        // Handle legacy string format
        textContent = messageContent;
        
        // Check if message contains image with %%% delimiters
        if (messageContent && messageContent.includes('%%%')) {
          const imageMatch = messageContent.match(/%%%(.*?)%%%/);
          if (imageMatch) {
            imageData = {
              url: imageMatch[1],
              fileName: 'Image',
              fileType: 'image'
            };
            // Remove image URL from text content
            textContent = messageContent.replace(/%%%.*?%%%/g, '').trim();
          }
        }
      }
      
      // Determine if we need to create a new chat
      let currentChatId = chatId;
      
      if (!currentChatId || currentChatId === 'new') {
        // Create a new chat
        const chatTitle = role === 'user' 
          ? textContent.substring(0, 20) + (textContent.length > 20 ? '...' : '') 
          : 'New Chat';
          
        const newChat = await createChat(userId, chatTitle, 'text');
        
        if (!newChat) {
          console.error('Failed to create new chat');
          return;
        }
        
        currentChatId = newChat.chat_id;
        setChatId(currentChatId);
        
        // Update URL without reloading
        window.history.replaceState(null, '', `/chat/${currentChatId}`);
        console.log('✅ Created new chat in database');
      }
      
      // Add the message to the database
      if (imageData) {
        // Add image message
        await addMessage(
          currentChatId,
          role === 'assistant' ? 'assistant' : 'user',
          'image',
          {
            url: imageData.url || imageData.fileContent || '',
            caption: textContent || ''
          },
          {
            fileName: imageData.fileName || 'Image',
            fileType: imageData.fileType || 'image/jpeg'
          }
        );
        
        console.log('🖼️ Saved image message to database');
      } else {
        // Add text message
        await addMessage(
          currentChatId,
          role === 'assistant' ? 'assistant' : 'user',
          'text',
          { text: textContent },
          {}
        );
        
        console.log('💬 Saved text message to database');
      }
      
      // Update chat title if it's a new chat and this is a user message
      if (role === 'user') {
        const title = textContent.substring(0, 30) + (textContent.length > 30 ? '...' : '');
        await updateChat(currentChatId, { title });
      }
    } catch (error) {
      console.error('Error saving chat to database:', error);
    }
  };
EOL

# Replace the fetchUserChats function
cat > /tmp/new_fetch_function.txt << 'EOL'
  // Fetch user chats from database
  const fetchUserChats = async () => {
    try {
      setIsLoadingChats(true);
      
      // Use AuthContext user for database operations
      if (!user?.uid) {
        console.log('No authenticated user, skipping chat fetch');
        setIsLoadingChats(false);
        return;
      }
      
      const userId = user.uid;
      console.log('Fetching chats for user:', userId);
      
      // Get all chats for this user
      const userChats = await getUserChats(userId);
      
      if (!userChats || userChats.length === 0) {
        console.log('No chats found for user');
        setIsLoadingChats(false);
        return;
      }
      
      // Process chats into the format expected by the UI
      const processedChats = await Promise.all(userChats.map(async (chat) => {
        // Get messages for this chat
        const chatMessages = await getChatMessages(chat.chat_id);
        
        // Convert messages to the format expected by the UI
        const processedMessages = chatMessages?.map(msg => {
          const uniqueId = msg.message_id;
          
          // Handle different content types
          if (msg.content_type === 'image') {
            return {
              id: uniqueId,
              role: msg.sender_type === 'assistant' ? 'assistant' : 'user',
              content: msg.content.caption || '',
              timestamp: msg.created_at,
              fileContent: msg.content.url,
              fileName: 'Image'
            };
          }
          
          // Regular text message
          return {
            id: uniqueId,
            role: msg.sender_type === 'assistant' ? 'assistant' : 'user',
            content: msg.content_type === 'text' ? msg.content.text : JSON.stringify(msg.content),
            timestamp: msg.created_at
          };
        }) || [];
        
        return {
          id: chat.chat_id,
          title: chat.title || 'New Chat',
          messages: processedMessages,
          role: 'general', // Default role
          roleDescription: '',
          description: chat.title || ''
        };
      }));
      
      setChats(processedChats);
      setIsLoadingChats(false);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setIsLoadingChats(false);
      
      // Use local chat in case of any error
      const localChatId = routeChatId || Date.now().toString();
      setChatId(localChatId);
      setChats([{
          id: localChatId,
          title: 'Local Chat',
          messages: [],
          role: 'general',
          description: 'Error mode - working offline'
        }]);
    }
  };
EOL

# Replace the startNewChat function
cat > /tmp/new_start_chat_function.txt << 'EOL'
  // Add a wrapper function for onClick event
  const handleStartNewChat = async () => {
    // Ensure the speech is stopped
    stopSpeech();
    
    // Clear all message state completely
    setMessages([]);
    setMessageHistory([]);
    setInputMessage('');
    setSelectedFile(null);
    setDisplayedText({});
    setIsTyping({});
    setEditingMessageId(null);
    setEditingContent('');
    setUserMessageCount(0);
    setIsMessageLimitReached(false);
    
    try {
      // Use AuthContext user instead of Supabase session
      if (!user?.uid) {
        // For non-logged in users, start with empty messages
        setMessages([]);
        return;
      }
      
      // Create a new chat
      const newChat = await createChat(user.uid, 'New Chat', 'text');
      
      if (!newChat) {
        console.error('Failed to create new chat');
        return;
      }
      
      // Update state and URL
      const newChatId = newChat.chat_id;
      setChatId(newChatId);
      navigate(`/chat/${newChatId}`, { replace: true });
      localStorage.setItem('lastActiveChatId', newChatId);
      
      // Reset to default role
      setSelectedRole(roleOptions[0]);
      
    } catch (error) {
      console.error('Error starting new chat:', error);
      // Fallback to empty messages
      setMessages([]);
    }
  };
EOL

# Use sed to replace the functions
# Note: This is a simplified approach and may need adjustments based on the exact file structure

# Find the saveChatToDatabase function and replace it
sed -i '' -e '/\/\/ Save chat message to database/,/^  };/c\
'"$(cat /tmp/new_save_function.txt)" "$FILE_PATH"

# Find the fetchUserChats function and replace it
sed -i '' -e '/\/\/ Fetch user chats from database/,/^  };/c\
'"$(cat /tmp/new_fetch_function.txt)" "$FILE_PATH"

# Find the startNewChat function and replace it
sed -i '' -e '/const startNewChat = /,/^  };/c\
'"$(cat /tmp/new_start_chat_function.txt)" "$FILE_PATH"

echo "ChatPage.tsx has been updated to use the new chat service."