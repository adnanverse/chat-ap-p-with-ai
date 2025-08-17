import React, { useState } from 'react';
import { FiDownload, FiExternalLink, FiMoreVertical, FiCopy, FiTrash2 } from 'react-icons/fi';
import UserAvatar from '../user/UserAvatar';
export default function MessageBubble({ 
  message, 
  isCurrentUser, 
  showAvatar = true, 
  onReply, 
  onDelete,
  onCopy 
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Format message timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle message actions
  const handleAction = (action) => {
    setShowDropdown(false);
    switch (action) {
      case 'reply':
        onReply && onReply(message);
        break;
      case 'copy':
        onCopy && onCopy(message.content);
        break;
      case 'delete':
        onDelete && onDelete(message.id);
        break;
      default:
        break;
    }
  };

  // Render different message types
  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="break-words">
            {message.replyTo && (
              <div className="bg-black bg-opacity-10 rounded p-2 mb-2 border-l-4 border-current">
                <p className="text-xs opacity-70">{message.replyTo.senderName}</p>
                <p className="text-sm">{message.replyTo.content}</p>
              </div>
            )}
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        );

      case 'image':
        return (
          <div className="max-w-xs">
            <img 
              src={message.fileUrl} 
              alt="Shared image"
              className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-w-full h-auto"
              onClick={() => {/* Handle image preview */}}
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="flex items-center space-x-3 p-3 bg-black bg-opacity-10 rounded-lg max-w-xs">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {message.fileName?.split('.').pop()?.toUpperCase() || 'FILE'}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.fileName}</p>
              <p className="text-xs opacity-70">{formatFileSize(message.fileSize || 0)}</p>
            </div>
            <a 
              href={message.fileUrl}
              download={message.fileName}
              className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded"
            >
              <FiDownload size={16} />
            </a>
          </div>
        );

      default:
        return <p>{message.content}</p>;
    }
  };

  return (
    <div className={`flex items-start space-x-2 group ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      {showAvatar && !isCurrentUser && (
        <UserAvatar 
          src={message.senderAvatar} 
          name={message.senderName || 'User'} 
          size="small"
        />
      )}

      {/* Message Content */}
      <div className={`relative max-w-sm lg:max-w-md xl:max-w-lg ${isCurrentUser ? 'ml-12' : 'mr-12'}`}>
        {/* Sender Name (for group chats) */}
        {!isCurrentUser && showAvatar && (
          <div className="mb-1">
            <span className="text-xs text-gray-500 font-medium">
              {message.senderName || 'User'}
            </span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`
            relative px-4 py-2 rounded-2xl
            ${isCurrentUser 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md' 
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }
          `}
        >
          {renderMessageContent()}
          
          {/* Message Info */}
          <div className={`flex items-center justify-between mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
            <span className="text-xs">
              {formatTime(message.timestamp)}
            </span>
            
            {/* Message Status (for current user messages) */}
            {isCurrentUser && (
              <div className="flex items-center space-x-1 ml-2">
                {message.status === 'sending' && (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {message.status === 'sent' && (
                  <span className="text-xs">✓</span>
                )}
                {message.status === 'delivered' && (
                  <span className="text-xs">✓✓</span>
                )}
                {message.status === 'read' && (
                  <span className="text-xs text-blue-200">✓✓</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Message Actions */}
        <div className={`
          absolute top-0 ${isCurrentUser ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'}
          opacity-0 group-hover:opacity-100 transition-opacity
        `}>
          <div className="flex items-center space-x-1 p-1">
            <button 
              onClick={() => handleAction('reply')}
              className="p-1 hover:bg-gray-200 rounded-full"
              title="Reply"
            >
              {/* <FiReply size={14} className="text-gray-600" /> */}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <FiMoreVertical size={14} className="text-gray-600" />
              </button>
              
              {showDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className={`
                    absolute top-6 z-20 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1
                    ${isCurrentUser ? 'right-0' : 'left-0'}
                  `}>
                    <button 
                      onClick={() => handleAction('copy')}
                      className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                    >
                      <FiCopy className="mr-2 h-3 w-3" />
                      Copy
                    </button>
                    <button 
                      onClick={() => handleAction('reply')}
                      className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                    >
                      {/* <FiReply className="mr-2 h-3 w-3" /> */}
                      Reply
                    </button>
                    {isCurrentUser && (
                      <button 
                        onClick={() => handleAction('delete')}
                        className="flex items-center w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        <FiTrash2 className="mr-2 h-3 w-3" />
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
