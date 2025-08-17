import React, { useEffect, useState } from 'react';
import { FiMoreVertical, FiCopy, FiTrash2, FiCornerUpLeft, FiDownload, FiImage, FiFile } from 'react-icons/fi';
import { listenToUser } from "../../utils/firebaseConfig";
import UserAvatar from '../user/UserAvatar';

export default function MessageItem({
  message,
  isCurrentUser,
  showAvatar = true,
  senderName,
  onReply,
  onDelete,
  onCopy
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [senderData, setSenderData] = useState(null);
  // Format message timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  useEffect(() => {
    const senderId = message?.senderId; // ✅ senderId ko message se lo

    if (senderId) {
      const unsubscribe = listenToUser(senderId, (user) => {
        setSenderData(user);
      });
      return () => unsubscribe();
    }
  }, [message?.senderId]);


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

  // Get message bubble styles
  const getBubbleStyles = () => {
    if (isCurrentUser) {
      return 'bg-blue-500 text-white rounded-2xl rounded-br-md max-w-xs ml-auto';
    } else {
      return 'bg-white text-gray-900 rounded-2xl rounded-bl-md max-w-xs shadow-sm border';
    }
  };

  // Render different message types
  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-2">
            {message.fileData && (
              <div className="relative">
                <img
                  src={message.fileData}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-lg cursor-pointer"
                  onClick={() => window.open(message.fileData, '_blank')}
                />
                <div className="absolute top-2 right-2">
                  <a
                    href={message.fileData}
                    download={message.fileName || "image.jpg"}
                    className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
                  >
                    <FiDownload size={14} />
                  </a>
                </div>
              </div>
            )}
            {message.content && (
              <p className="text-sm break-words">{message.content}</p>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                <FiFile className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {message.fileName || 'File'}
                </p>
                {message.fileSize && (
                  <p className="text-xs text-gray-500">
                    {formatFileSize(message.fileSize)}
                  </p>
                )}
              </div>
              {message.fileData && (
                <a
                  href={message.fileData}
                  download={message.fileName}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FiDownload size={16} />
                </a>
              )}
            </div>
            {message.content && (
              <p className="text-sm break-words">{message.content}</p>
            )}
          </div>
        );

      case 'text':
      default:
        return (
          <div>
            {message.replyTo && (
              <div className={`mb-2 p-2 rounded-lg border-l-2 ${isCurrentUser
                ? 'bg-white bg-opacity-20 border-white border-opacity-50 text-white'
                : 'bg-gray-100 border-gray-300 text-gray-700'
                }`}>
                <p className="text-xs font-medium opacity-75">
                  {message.replyTo.senderName || 'Someone'}
                </p>
                <p className="text-xs opacity-90 truncate">
                  {message.replyTo.content}
                </p>
              </div>
            )}
            <p className="text-sm break-words">{message.content}</p>
          </div>
        );
    }
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}>
      {/* Avatar for other users */}
      {!isCurrentUser && showAvatar && (
        <div className="flex-shrink-0 mr-2">
          <UserAvatar
            src={senderData?.photoURL}
            name={senderData?.displayName}
            size="small"
          />
        </div>
      )}

      {/* Message bubble */}
      <div className="relative max-w-xs">
        {/* Sender name (for group chats - not shown in 1:1) */}
        {!isCurrentUser && !showAvatar && (
          <div className="ml-2 mb-1">
            <span className="text-xs text-gray-500 font-medium">{senderName}</span>
          </div>
        )}

        {/* Message content */}
        <div className={`relative ${getBubbleStyles()} p-3 transition-all duration-200 hover:shadow-md`}>
          {renderMessageContent()}

          {/* Message timestamp */}
          <div className={`flex items-center justify-between mt-2 ${isCurrentUser ? 'text-white text-opacity-75' : 'text-gray-500'
            }`}>
            <span className="text-xs">
              {formatTime(message.timestamp)}
            </span>

            {/* Message status (for current user messages) */}
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

          {/* More options button */}
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`absolute -top-2 ${isCurrentUser ? '-left-8' : '-right-8'} 
              p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity
              ${isCurrentUser ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600'}
              hover:bg-gray-300`}
          >
            <FiMoreVertical size={14} />
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className={`absolute z-20 ${isCurrentUser ? 'left-0' : 'right-0'} 
                top-8 min-w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1`}>

                <button
                  onClick={() => handleAction('reply')}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiCornerUpLeft className="mr-2 h-3 w-3" />
                  Reply
                </button>

                <button
                  onClick={() => handleAction('copy')}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiCopy className="mr-2 h-3 w-3" />
                  Copy
                </button>

                {/* Download option for files/images */}
                {(message.type === 'file' || message.type === 'image') && message.fileData && (
                  <a
                    href={message.fileData}
                    download={message.fileName || (message.type === 'image' ? 'image.jpg' : 'file')}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    <FiDownload className="mr-2 h-3 w-3" />
                    Download
                  </a>
                )}

                {/* Delete option (only for current user's messages) */}
                {isCurrentUser && (
                  <>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={() => handleAction('delete')}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <FiTrash2 className="mr-2 h-3 w-3" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Message reactions (placeholder for future feature) */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex items-center space-x-1 mt-1 ml-2">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <div
                key={emoji}
                className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
              >
                <span>{emoji}</span>
                <span className="text-gray-500">{users.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spacer for current user messages to align with avatar space */}
      {isCurrentUser && (
        <div className="flex-shrink-0 ml-2 w-8"></div>
      )}
    </div>
  );
}
