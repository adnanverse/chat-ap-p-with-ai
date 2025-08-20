import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';


export default function ChatRoom({ currentUser }) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize for responsive design
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-screen bg-gray-100 flex flex-col">
        {!selectedConversation ? (
          // Show sidebar on mobile when no conversation selected
          <Sidebar
            currentUser={currentUser}
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversation?.id}
          />
        ) : (
          // Show chat interface on mobile when conversation selected
          <div className="flex flex-col h-full">
            <Navbar
              currentUser={currentUser}
              currentConversation={selectedConversation}
              onBack={() => setSelectedConversation(null)}
              showBackButton={true}
            />
            <div className="flex-1 flex flex-col bg-white">
              <MessageList
                currentConversation={selectedConversation}
                currentUser={currentUser}
              />
              <MessageInput
                currentConversation={selectedConversation}
                currentUser={currentUser}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className=" h-[100vh] relative bg-gray-100 flex">
      {/* Sidebar */}
      <Sidebar
        currentUser={currentUser}
        onSelectConversation={handleSelectConversation}
        selectedConversationId={selectedConversation?.id}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Navbar
          currentUser={currentUser}
          currentConversation={selectedConversation}
        />
        
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-white">
            <MessageList
              currentConversation={selectedConversation}
              currentUser={currentUser}
            />
            <MessageInput
              currentConversation={selectedConversation}
              currentUser={currentUser}
            />
          </div>
        ) : (
          // No conversation selected state
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
        )}
      </div>
    </div>
  );
};
