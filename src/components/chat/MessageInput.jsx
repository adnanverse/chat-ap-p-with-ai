import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip, FiImage, FiMic, FiSmile, FiX, FiFile } from 'react-icons/fi';
import { sendMessage, uploadChatFile } from '../../utils/firebaseConfig';
export default function MessageInput({
  currentConversation,
  currentUser,
  replyTo,
  onCancelReply,
  onTyping,
  onStopTyping,
  placeholder = "Type a message..."
}) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px';
    }
  }, [message]);

  // Handle typing indicators
  const handleTyping = () => {
    if (onTyping) onTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (onStopTyping) onStopTyping();
    }, 2000);
  };

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    if (value.trim()) {
      handleTyping();
    } else if (onStopTyping) {
      onStopTyping();
    }
  };

  // ✅ FIXED: Handle sending message
  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage && selectedFiles.length === 0) return;
    if (!currentConversation?.id || !currentUser?.uid) return;

    setIsSending(true);
    setIsUploading(true);

    try {
      let fileUrl = null;
      let fileName = null;
      let fileSize = null;
      let messageType = 'text';

      // ✅ File Upload Handling
      if (selectedFiles.length > 0) {
        const file = selectedFiles[0];

        try {
          const messageData = await uploadChatFile(
            currentConversation.id,
            file,
            currentUser.uid // ✅ FIX: now senderId is UID
          );

          fileUrl = messageData.fileUrl;
          fileName = messageData.fileName;
          fileSize = messageData.fileSize;
          messageType = messageData.type;
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          alert('Failed to upload file. Please try again.');
          return;
        }
      }

      // ✅ Send message
      await sendMessage(
        currentConversation.id,
        currentUser.uid,
        trimmedMessage || fileName || 'File shared',
        messageType,
        fileUrl,   // ✅ yeh fileData banega
        fileName,
        fileSize
      );


      // Clear input
      setMessage('');
      setSelectedFiles([]);
      setUploadProgress(0);
      if (onStopTyping) onStopTyping();
      if (onCancelReply) onCancelReply();

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      setIsUploading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles([files[0]]);
      setShowAttachments(false);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleVoiceRecording = () => {
    setIsRecording(!isRecording);
    console.log(isRecording ? 'Stop recording...' : 'Start recording...');
  };

  const handleEmoji = () => {
    const emojis = ['😊', '😂', '❤️', '👍', '👎', '😢', '😮', '😡'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setMessage(prev => prev + randomEmoji);
    textareaRef.current?.focus();
  };

  const isDisabled = isUploading || isSending;
  const canSend = (message.trim() || selectedFiles.length > 0) && !isDisabled;


  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-blue-50 border-l-4 border-blue-500 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-600 font-medium">Replying to {replyTo.senderName}</p>
            <p className="text-sm text-gray-700 truncate">{replyTo.content}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="ml-2 p-1 text-blue-600 hover:bg-blue-100 rounded"
            disabled={isDisabled}
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Selected files:</p>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    {file.type.startsWith('image/') ? (
                      <FiImage className="w-5 h-5 text-white" />
                    ) : (
                      <FiFile className="w-5 h-5 text-white" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>

                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                  disabled={isDisabled}
                >
                  <FiX size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && uploadProgress > 0 && (
        <div className="px-4 py-2 bg-blue-50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-blue-600">Uploading file...</span>
            <span className="text-xs text-blue-600">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1">
            <div
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-2 p-4">
        {/* Attachment Button */}
        <div className="relative">
          <button
            onClick={() => setShowAttachments(!showAttachments)}
            disabled={isDisabled}
            className={`p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 ${showAttachments ? 'bg-gray-100 text-gray-700' : ''
              }`}
            title="Attach file"
          >
            <FiPaperclip size={20} />
          </button>

          {/* Attachment Menu */}
          {showAttachments && !isDisabled && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowAttachments(false)}
              />
              <div className="absolute bottom-12 left-0 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-40">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiImage className="mr-3 h-4 w-4" />
                  Photo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiFile className="mr-3 h-4 w-4" />
                  Document
                </button>
              </div>
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder={
              selectedFiles.length > 0
                ? "Add a caption..."
                : `Message ${currentConversation?.name || 'someone'}...`
            }
            disabled={isDisabled}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32 min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            rows={1}
          />

          {/* Emoji Button */}
          <button
            onClick={handleEmoji}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            title="Add emoji"
            disabled={isDisabled}
          >
            <FiSmile size={18} />
          </button>
        </div>

        {/* Send/Voice Button */}
        {canSend ? (
          <button
            onClick={handleSendMessage}
            disabled={isDisabled}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FiSend size={20} />
            )}
          </button>
        ) : (
          <button
            onClick={handleVoiceRecording}
            disabled={isDisabled}
            className={`p-2 transition-colors rounded-full disabled:opacity-50 ${isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-gray-500 hover:bg-gray-100'
              }`}
            title={isRecording ? "Stop recording" : "Record voice message"}
          >
            <FiMic size={20} />
          </button>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={false}
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.txt,.zip,.rar,.ppt,.pptx,.xls,.xlsx"
        disabled={isDisabled}
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple={false}
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*"
        disabled={isDisabled}
      />
    </div>
  );
}



