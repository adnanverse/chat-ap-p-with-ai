
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import MessageItem from './MessageItem';
export default function MessageList({ currentConversation, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Listen to messages in real-time
  useEffect(() => {
    if (!currentConversation?.id) {
      setMessages([]);
      return;
    }

    setIsLoading(true);

    const messagesRef = collection(db, 'chats', currentConversation.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = [];
      
      snapshot.forEach((doc) => {
        const messageData = { id: doc.id, ...doc.data() };
        
        // Convert Firestore timestamp to JavaScript Date
        if (messageData.timestamp && messageData.timestamp.toDate) {
          messageData.timestamp = messageData.timestamp.toDate().toISOString();
        } else if (!messageData.timestamp) {
          messageData.timestamp = new Date().toISOString();
        }
        
        messagesData.push(messageData);
      });

      setMessages(messagesData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error listening to messages:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentConversation?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle message actions
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await deleteDoc(doc(db, 'chats', currentConversation.id, 'messages', messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message.');
    }
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content).then(() => {
      // You could show a toast notification here
      console.log('Message copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy message:', err);
    });
  };

  const handleReplyToMessage = (message) => {
    // This would typically set a reply state that MessageInput can use
    console.log('Reply to message:', message);
    // For now, just scroll to bottom to focus on input
    scrollToBottom();
  };

  // Format date divider
  const formatDateDivider = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  // Show empty state when no conversation selected
  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-gray-400 text-4xl">💬</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to ChatApp</h3>
          <p className="text-gray-600 max-w-sm">
            Select a conversation from the sidebar to start chatting with your friends and colleagues.
          </p>
        </div>
      </div>
    );
  }

  // Show empty conversation state
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-blue-500 text-2xl">👋</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Start a conversation
            </h4>
            <p className="text-gray-600 max-w-sm">
              Send a message to begin chatting with {currentConversation.name}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate();

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto bg-gray-50"
      style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f3f4f6' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
      }}
    >
      <div className="p-4 space-y-4">
        {messageGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Date Divider */}
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white px-4 py-1 rounded-full shadow-sm border">
                <span className="text-xs text-gray-500 font-medium">
                  {formatDateDivider(group.messages[0].timestamp)}
                </span>
              </div>
            </div>

            {/* Messages for this date */}
            <div className="space-y-2">
              {group.messages.map((message, messageIndex) => {
                const isCurrentUser = message.senderId === currentUser.uid;
                const showAvatar = !isCurrentUser && (
                  messageIndex === group.messages.length - 1 || // Last message in group
                  group.messages[messageIndex + 1]?.senderId !== message.senderId // Next message is from different sender
                );

                return (
                  <div 
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    <MessageItem
                      message={message}
                      isCurrentUser={isCurrentUser}
                      showAvatar={showAvatar}
                      senderName={isCurrentUser ? 'You' : currentConversation.name}
                      onReply={handleReplyToMessage}
                      onDelete={handleDeleteMessage}
                      onCopy={handleCopyMessage}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
