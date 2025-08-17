import React, { useState, useEffect } from 'react';
import { FiSearch, FiEdit3, FiLogOut, FiMessageCircle, FiUsers } from 'react-icons/fi';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, logout, searchUsers, createChat, updateUserStatus } from '../../utils/firebaseConfig';
import UserAvatar from '../user/UserAvatar';
import ProfileModal from '../user/ProfileModal';

export default function Sidebar({ currentUser, onSelectConversation, selectedConversationId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'contacts'
  const [conversations, setConversations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [usersData, setUsersData] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Listen to user's conversations in real-time
  useEffect(() => {
    if (!currentUser?.uid) return;

    const chatsRef = collection(db, 'chats');
    // Note: This query requires composite index: participants (Array) + lastMessageTime (Desc)
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData = [];
      
      for (const docSnapshot of snapshot.docs) {
        const chatData = { id: docSnapshot.id, ...docSnapshot.data() };
        
        // Convert Firestore timestamps
        if (chatData.lastMessageTime && chatData.lastMessageTime.toDate) {
          chatData.lastMessageTime = chatData.lastMessageTime.toDate();
        }
        if (chatData.createdAt && chatData.createdAt.toDate) {
          chatData.createdAt = chatData.createdAt.toDate();
        }
        
        chatsData.push(chatData);
      }
      
      setConversations(chatsData);
      
      // Fetch user data for all participants
      const userIds = new Set();
      chatsData.forEach(chat => {
        chat.participants.forEach(userId => {
          if (userId !== currentUser.uid) {
            userIds.add(userId);
          }
        });
      });
      
      fetchUsersData(Array.from(userIds));
    }, (error) => {
      console.error('Error listening to conversations:', error);
      // If index error, show user-friendly message
      if (error.code === 'failed-precondition') {
        alert('Setting up chat database... Please wait a moment and refresh.');
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Fetch users data
  const fetchUsersData = async (userIds) => {
    if (userIds.length === 0) return;
    
    try {
      const usersDataMap = {};
      
      for (const userId of userIds) {
        if (!usersData[userId]) { // Only fetch if not already cached
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() };
            
            // Convert Firestore timestamps
            if (userData.lastSeen && userData.lastSeen.toDate) {
              userData.lastSeen = userData.lastSeen.toDate();
            }
            if (userData.createdAt && userData.createdAt.toDate) {
              userData.createdAt = userData.createdAt.toDate();
            }
            
            usersDataMap[userId] = userData;
          }
        }
      }
      
      setUsersData(prev => ({ ...prev, ...usersDataMap }));
    } catch (error) {
      console.error('Error fetching users data:', error);
    }
  };

  // Handle search functionality
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        try {
          console.log('Searching for:', searchQuery); // Debug log
          const results = await searchUsers(searchQuery.trim());
          console.log('Search results:', results); // Debug log
          
          // Filter out current user
          const filteredResults = results.filter(user => user.id !== currentUser.uid);
          setSearchResults(filteredResults);
        } catch (error) {
          console.error('Error searching users:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, currentUser.uid]);

  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
    const otherUser = usersData[otherUserId];
    
    const transformedConversation = {
      id: conversation.id,
      participants: conversation.participants,
      name: otherUser?.displayName || 'User',
      avatar: otherUser?.photoURL || null,
      lastMessage: conversation.lastMessage || 'No messages yet',
      lastMessageTime: conversation.lastMessageTime ? formatLastMessageTime(conversation.lastMessageTime) : '',
      isOnline: otherUser?.isOnline || false,
      lastSeen: otherUser?.lastSeen,
      email: otherUser?.email,
      phone: otherUser?.phone,
      bio: otherUser?.bio
    };
    
    onSelectConversation(transformedConversation);
  };

  // Handle starting new chat
  const handleStartNewChat = async (user) => {
    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => 
        conv.participants.includes(user.id)
      );
      
      if (existingConversation) {
        handleSelectConversation(existingConversation);
        return;
      }
      
      // Create new conversation
      const chatId = await createChat([currentUser.uid, user.id]);
      
      // Create a temporary conversation object for immediate UI update
      const newConversation = {
        id: chatId,
        participants: [currentUser.uid, user.id],
        lastMessage: null,
        lastMessageTime: new Date()
      };
      
      // Add user data to cache
      setUsersData(prev => ({
        ...prev,
        [user.id]: user
      }));
      
      // Select the new conversation
      handleSelectConversation(newConversation);
      
      // Clear search and switch to chats tab
      setSearchQuery('');
      setActiveTab('chats');
      
    } catch (error) {
      console.error('Error creating new chat:', error);
      alert('Failed to create chat. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await updateUserStatus(currentUser.uid, false);
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Format last message time
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return timestamp.toLocaleDateString();
  };

  // Filter conversations based on search (when in chats tab)
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true;
    
    const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
    const otherUser = usersData[otherUserId];
    
    const searchLower = searchQuery.toLowerCase();
    return (
      otherUser?.displayName?.toLowerCase().includes(searchLower) ||
      conversation.lastMessage?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <UserAvatar 
              src={currentUser?.photoURL} 
              name={currentUser?.displayName} 
              size="medium" 
              status="online"
            />
            <div className="flex-1">
              <h3 className="text-white font-semibold truncate">
                {currentUser?.displayName || 'User'}
              </h3>
              <p className="text-blue-100 text-sm">Active now</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowProfileModal(true)}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Edit Profile"
            >
              <FiEdit3 size={18} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Logout"
            >
              <FiLogOut size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={activeTab === 'chats' ? 'Search conversations...' : 'Search users...'}
            className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg placeholder-blue-100 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium ${
            activeTab === 'chats'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <FiMessageCircle size={16} />
          <span>Chats</span>
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium ${
            activeTab === 'contacts'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <FiUsers size={16} />
          <span>Find Users</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' && (
          <div className="divide-y divide-gray-100">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => {
                const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
                const otherUser = usersData[otherUserId];
                
                if (!otherUser) return null;
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedConversationId === conversation.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <UserAvatar 
                        src={otherUser.photoURL} 
                        name={otherUser.displayName} 
                        size="medium" 
                        status={otherUser.isOnline ? 'online' : 'offline'}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {otherUser.displayName}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatLastMessageTime(conversation.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <FiMessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery ? 'No conversations match your search.' : 'Start a new conversation to get started.'}
                </p>
                {!searchQuery && (
                  <button 
                    onClick={() => setActiveTab('contacts')}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiUsers className="mr-2 h-4 w-4" />
                    Find Users
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="p-4">
            {isSearching ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Searching users...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Search Results</h3>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleStartNewChat(user)}
                    className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <UserAvatar 
                      src={user.photoURL} 
                      name={user.displayName} 
                      size="medium" 
                      status={user.isOnline ? 'online' : 'offline'}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {user.displayName}
                      </h4>
                      {user.email && (
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      )}
                      {user.bio && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim().length > 1 ? (
              <div className="text-center py-8">
                <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try searching with a different name.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Find Users</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Search for users by name to start a new conversation.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={currentUser}
        onUpdate={(updatedUser) => {
          // This will be called after successful profile update
          console.log('Profile updated:', updatedUser);
          setShowProfileModal(false);
        }}
      />
    </div>
  );
}