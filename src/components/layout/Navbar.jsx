import React, { useState } from 'react';
import { FiPhone, FiVideo, FiMoreVertical, FiArrowLeft, FiInfo, FiLogOut, FiSettings } from 'react-icons/fi';
import { logout } from '../../utils/firebaseConfig.js';
import UserAvatar from '../user/UserAvatar';
export default function Navbar({ 
  currentUser, 
  currentConversation, 
  onBack,
  showBackButton = false 
}) {
    const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Format user status for conversation
  const getConversationStatus = () => {
    if (!currentConversation) return '';
    
    if (currentConversation.isOnline) {
      return 'Active now';
    } else if (currentConversation.lastSeen) {
      const lastSeen = new Date(currentConversation.lastSeen);
      const now = new Date();
      const diffInMinutes = Math.floor((now - lastSeen) / (1000 * 60));
      
      if (diffInMinutes < 5) {
        return 'Active recently';
      } else if (diffInMinutes < 60) {
        return `Active ${diffInMinutes}m ago`;
      } else {
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
          return `Active ${diffInHours}h ago`;
        } else {
          const diffInDays = Math.floor(diffInHours / 24);
          return `Active ${diffInDays}d ago`;
        }
      }
    }
    return 'Offline';
  };

  // Handle call actions (placeholder)
  const handleVoiceCall = () => {
    console.log('Starting voice call with:', currentConversation?.name);
    alert(`Voice call with ${currentConversation?.name} (Feature coming soon!)`);
  };

  const handleVideoCall = () => {
    console.log('Starting video call with:', currentConversation?.name);
    alert(`Video call with ${currentConversation?.name} (Feature coming soon!)`);
  };

  const handleConversationInfo = () => {
    console.log('Show conversation info for:', currentConversation?.name);
    alert(`Conversation info for ${currentConversation?.name} (Feature coming soon!)`);
  };

  return (
    <div className="bg-white border-b sticky top-0 left-0 z-[9] border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center space-x-3">
        {/* Back Button (for mobile) */}
        {showBackButton && (
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
          >
            <FiArrowLeft size={20} />
          </button>
        )}

        {/* App Title or Conversation Info */}
        {currentConversation ? (
          <>
            {/* Conversation Avatar */}
            <UserAvatar
              src={currentConversation.avatar}
              name={currentConversation.name}
              size="medium"
              status={currentConversation.isOnline ? 'online' : 'offline'}
            />

            {/* Conversation Details */}
            <div 
              onClick={handleConversationInfo}
              className="flex-1 cursor-pointer hover:bg-gray-50 rounded p-1 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {currentConversation.name}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {getConversationStatus()}
              </p>
            </div>
          </>
        ) : (
          /* App Title */
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">💬</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">ChatApp</h1>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* Conversation Actions (only show when in a conversation) */}
        {currentConversation && (
          <>
            {/* Voice Call Button */}
            <button
              onClick={handleVoiceCall}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
              title="Voice call"
            >
              <FiPhone size={18} />
            </button>

            {/* Video Call Button */}
            <button
              onClick={handleVideoCall}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
              title="Video call"
            >
              <FiVideo size={18} />
            </button>

            {/* Info Button */}
            <button
              onClick={handleConversationInfo}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Conversation info"
            >
              <FiInfo size={18} />
            </button>
          </>
        )}

        {/* User Menu */}
        <div className="relative">
          {/* User Avatar Button */}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <UserAvatar
              src={currentUser?.photoURL}
              name={currentUser?.displayName}
              size="small"
              status="online"
            />
            
            {/* User name (hidden on mobile) */}
            <span className="hidden sm:block text-sm font-medium text-gray-700 truncate max-w-32">
              {currentUser?.displayName || 'User'}
            </span>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentUser?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser?.email}
                  </p>
                </div>
                
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <FiSettings className="mr-3 h-4 w-4" />
                  Settings
                </button>
                
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <FiInfo className="mr-3 h-4 w-4" />
                  Profile
                </button>
                
                <hr className="my-1 border-gray-200" />
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <FiLogOut className="mr-3 h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>

        {/* More Options (for conversation) */}
        {currentConversation && (
          <div className="relative">
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiMoreVertical size={18} />
            </button>
            
            {/* More Options Dropdown */}
            {showMoreMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMoreMenu(false)}
                />
                <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button 
                    onClick={() => {
                      handleConversationInfo();
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiInfo className="mr-3 h-4 w-4" />
                    View profile
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <span className="mr-3">🔕</span>
                    Mute notifications
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <span className="mr-3">📎</span>
                    View shared files
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <span className="mr-3">🚫</span>
                    Block user
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <span className="mr-3">🗑️</span>
                    Delete conversation
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};