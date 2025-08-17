import React from 'react';
import { FiPhone, FiVideo, FiMoreVertical, FiArrowLeft, FiInfo } from 'react-icons/fi';
import UserAvatar from '../user/UserAvatar';
export default function Header({ 
  currentConversation, 
  onBack,
  onVoiceCall, 
  onVideoCall, 
  onToggleInfo,
  showBackButton = false 
}) {
  if (!currentConversation) {
    return (
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">ChatApp</h1>
        </div>
      </div>
    );
  }

  // Format user status
  const getStatusText = () => {
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

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Left Section - User Info */}
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

        {/* User Avatar */}
        <UserAvatar 
          src={currentConversation.avatar} 
          name={currentConversation.name} 
          size="medium"
          status={currentConversation.isOnline ? 'online' : 'offline'}
          onClick={onToggleInfo}
          className="cursor-pointer"
        />

        {/* User Details */}
        <div 
          onClick={onToggleInfo}
          className="flex-1 cursor-pointer hover:bg-gray-50 rounded p-1 transition-colors"
        >
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {currentConversation.name}
          </h3>
          <p className="text-xs text-gray-500 truncate">
            {getStatusText()}
          </p>
        </div>
      </div>

      {/* Right Section - Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* Voice Call Button */}
        <button
          onClick={onVoiceCall}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          title="Voice call"
        >
          <FiPhone size={20} />
        </button>

        {/* Video Call Button */}
        <button
          onClick={onVideoCall}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          title="Video call"
        >
          <FiVideo size={20} />
        </button>

        {/* Info Button */}
        <button
          onClick={onToggleInfo}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          title="Conversation info"
        >
          <FiInfo size={20} />
        </button>

        {/* More Options Button */}
        <div className="relative group">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <FiMoreVertical size={20} />
          </button>
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <button 
              onClick={onToggleInfo}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <FiInfo className="mr-3 h-4 w-4" />
              View profile
            </button>
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              🔕
              <span className="ml-3">Mute notifications</span>
            </button>
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              📎
              <span className="ml-3">View shared files</span>
            </button>
            <hr className="my-1 border-gray-200" />
            <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              🚫
              <span className="ml-3">Block user</span>
            </button>
            <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              🗑️
              <span className="ml-3">Delete conversation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
