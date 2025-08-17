// src/components/chat/ChatInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, sendMessage, uploadChatFile } from '../../utils/firebaseConfig';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
export default function ChatInterface({
    currentConversation,
    currentUser
}) {
    const [messages, setMessages] = useState([]);
    const [replyTo, setReplyTo] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserData, setOtherUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const unsubscribeRef = useRef(null);

    // Fetch other user data
    useEffect(() => {
        const fetchOtherUserData = async () => {
            if (!currentConversation || !currentConversation.participants) return;

            const otherUserId = currentConversation.participants.find(id => id !== currentUser.uid);
            if (otherUserId) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', otherUserId));
                    if (userDoc.exists()) {
                        const userData = { id: userDoc.id, ...userDoc.data() };

                        // Convert Firestore timestamps
                        if (userData.lastSeen && userData.lastSeen.toDate) {
                            userData.lastSeen = userData.lastSeen.toDate();
                        }
                        if (userData.createdAt && userData.createdAt.toDate) {
                            userData.createdAt = userData.createdAt.toDate();
                        }

                        setOtherUserData(userData);
                    }
                } catch (error) {
                    console.error('Error fetching other user data:', error);
                }
            }
        };

        fetchOtherUserData();
    }, [currentConversation, currentUser]);

    // Listen to messages in real-time
    useEffect(() => {
        if (!currentConversation?.id) return;

        setIsLoading(true);

        const messagesRef = collection(db, 'messages');
        const q = query(
            messagesRef,
            where('chatId', '==', currentConversation.id),
            where('deleted', '==', false),
            orderBy('timestamp', 'asc')
        );

        // Clean up previous listener
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        unsubscribeRef.current = onSnapshot(q, (snapshot) => {
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

        // Cleanup function
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [currentConversation?.id]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Handle sending new message
    const handleSendMessage = async (messageData) => {
        if (!currentConversation?.id || !currentUser?.uid) return;

        try {
            let fileUrl = null;
            let fileName = null;
            let fileSize = null;

            // Handle file upload if there are files
            if (messageData.files && messageData.files.length > 0) {
                const file = messageData.files[0]; // Handle first file for now

                try {
                    fileUrl = await uploadChatFile(currentConversation.id, file, (progress) => {
                        console.log(`Upload progress: ${progress}%`);
                    });

                    fileName = file.name;
                    fileSize = file.size;
                    messageData.type = file.type.startsWith('image/') ? 'image' : 'file';
                } catch (uploadError) {
                    console.error('Error uploading file:', uploadError);
                    throw new Error('Failed to upload file');
                }
            }

            // Send message to Firestore
            await sendMessage(
                currentConversation.id,
                currentUser.uid,
                messageData.content || fileName || 'File shared',
                messageData.type,
                fileUrl,
                fileName,
                fileSize
            );

            // Clear reply
            setReplyTo(null);

        } catch (error) {
            console.error('Error sending message:', error);
            // Show error message to user
            alert('Failed to send message. Please try again.');
        }
    };

    // Handle message reply
    const handleReply = (message) => {
        setReplyTo(message);
    };

    // Handle message deletion
    const handleDeleteMessage = async (messageId) => {
        console.log('Delete message:', messageId);
        // TODO: Implement message deletion in Firestore
    };

    // Handle copy message
    const handleCopyMessage = (content) => {
        navigator.clipboard.writeText(content).then(() => {
            console.log('Message copied to clipboard');
        });
    };

    // Handle typing indicators
    const handleTyping = () => {
        setIsTyping(true);
    };

    const handleStopTyping = () => {
        setIsTyping(false);
    };

    // Format date for message groups
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
            return date.toLocaleDateString();
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

    // Transform message data for MessageBubble component
    const transformMessageData = (message) => {
        return {
            ...message,
            senderName: message.senderId === currentUser.uid ? currentUser.displayName : otherUserData?.displayName || 'User',
            senderAvatar: message.senderId === currentUser.uid ? currentUser.photoURL : otherUserData?.photoURL,
            status: 'read'
        };
    };

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

    const messageGroups = groupMessagesByDate();

    return (
        <div className="flex-1 flex flex-col bg-gray-50">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-4xl mx-auto">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-sm text-gray-500">Loading messages...</p>
                        </div>
                    ) : messageGroups.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <span className="text-blue-500 text-2xl">👋</span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Start a conversation
                            </h3>
                            <p className="text-gray-600">
                                Send a message to begin chatting with {otherUserData?.displayName || 'your friend'}.
                            </p>
                        </div>
                    ) : (
                        messageGroups.map((group, groupIndex) => (
                            <div key={groupIndex}>
                                {/* Date Divider */}
                                <div className="flex items-center justify-center my-4">
                                    <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                                        <span className="text-xs font-medium text-gray-500">
                                            {formatDateDivider(group.messages[0].timestamp)}
                                        </span>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="space-y-4">
                                    {group.messages.map((message, index) => {
                                        const isCurrentUser = message.senderId === currentUser.uid;
                                        const prevMessage = index > 0 ? group.messages[index - 1] : null;
                                        const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;

                                        return (
                                            <MessageBubble
                                                key={message.id}
                                                message={transformMessageData(message)}
                                                isCurrentUser={isCurrentUser}
                                                showAvatar={showAvatar}
                                                onReply={handleReply}
                                                onDelete={handleDeleteMessage}
                                                onCopy={handleCopyMessage}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}

                    {/* Typing Indicator */}
                    {isTyping && otherUserData && (
                        <div className="flex items-center space-x-2 mt-4">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-semibold">
                                    {otherUserData.displayName?.charAt(0) || '?'}
                                </span>
                            </div>
                            <div className="bg-gray-200 rounded-2xl px-4 py-2">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Message Input */}
            <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                onStopTyping={handleStopTyping}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                placeholder={`Message ${otherUserData?.displayName || 'user'}...`}
            />
        </div>
    );
};
