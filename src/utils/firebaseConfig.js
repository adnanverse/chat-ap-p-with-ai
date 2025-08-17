

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL , uploadBytesResumable } from 'firebase/storage';
// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Authentication functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const registerWithEmail = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);

// User functions
export const createUserDocument = async (user, additionalData = {}) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user;
    const createdAt = serverTimestamp();

    try {
      await setDoc(userRef, {
        displayName: displayName || additionalData.fullName || 'User',
        email,
        photoURL: photoURL || null,
        bio: additionalData.bio || 'Hey there! I am using ChatApp.',
        phone: additionalData.phone || null,
        isOnline: true,
        lastSeen: serverTimestamp(),
        createdAt,
        ...additionalData
      });
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }

  return userRef;
};

export const updateUserStatus = async (userId, isOnline) => {
  if (!userId) return;

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

export const searchUsers = async (searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) return [];

  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

// Chat functions
export const createChat = async (participants) => {
  try {
    const chatRef = await addDoc(collection(db, 'chats'), {
      participants,
      createdAt: serverTimestamp(),
      lastMessage: null,
      lastMessageTime: serverTimestamp()
    });

    return chatRef.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

export const sendMessage = async (
  chatId,
  senderId,
  content,
  type = "text",
  fileUrl = null,
  fileName = null,
  fileSize = null
) => {
  if (!chatId || !senderId) throw new Error('chatId & senderId required');

  const message = {
    senderId,
    content: content || null,
    type,
    timestamp: serverTimestamp(),
    status: "sent",
  };

  // UI expects fileData
  if (fileUrl) {
    message.fileData = fileUrl;
    message.fileName = sanitizeFileName(fileName || '');
    message.fileSize = fileSize || null;
  }

  await addDoc(collection(db, "chats", chatId, "messages"), message);

  // maintain chat summary
  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, {
    lastMessage: type === 'text'
      ? (content || '')
      : (type === 'image' ? '📷 Image' : (message.fileName || '📎 File')),
    lastMessageTime: serverTimestamp()
  });
};


// File upload functions
export const uploadFile = async (file, path, onProgress = null) => {
  try {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// export const uploadChatFile = async (chatId, file, onProgress = null) => {
//   const path = `chat-files/${chatId}/${Date.now()}_${file.name}`;
//   return uploadFile(file, path, onProgress);
// };

// Convert File to Base64
// Convert File to Base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

// Upload Avatar (Base64 in Firestore)
// Update user avatar in Firestore
export const updateUserAvatar = async (uid, file) => {
  const url = await uploadAvatar(uid, file);

  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    photoURL: url,
    updatedAt: serverTimestamp()
  });

  return url;
};
// ✅ Listen to chat messages in realtime
export const listenToMessages = (chatId, callback) => {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(messages); // UI instantly update
  });
};

// ✅ Listen to single user profile in realtime
export const listenToUser = (uid, callback) => {
  const userRef = doc(db, "users", uid);

  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    }
  });
};

// ✅ Upload Avatar to ImgBB (free)
export const uploadAvatar = async (userId, file) => {
  if (!file) throw new Error("No file selected");

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!data.success) {
    throw new Error("ImgBB upload failed");
  }

  // ✅ ImgBB gives us a URL
  const url = data.data.url;

  // Save photoURL in Firestore
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    photoURL: url,
    updatedAt: serverTimestamp(),
  });

  return url;
};



// Upload Chat File (Base64 in Firestore)
// Upload Chat File via ImgBB
// ⛔️ Remove the ImgBB version. Use Firebase Storage instead.
export const uploadChatFile = async (chatId, file, senderId) => {
  if (!chatId || !file || !senderId) throw new Error('chatId, file, senderId required');

  const isImage = IMAGE_TYPES.includes(file.type);
  const allowed = isImage ? IMAGE_TYPES : [...IMAGE_TYPES, ...DOC_TYPES];
  if (!allowed.includes(file.type)) throw new Error('Unsupported file type');

  const max = isImage ? MAX_IMAGE_MB : MAX_FILE_MB;
  if (file.size > max * 1024 * 1024) throw new Error(`File must be <= ${max}MB`);

  const safeName = sanitizeFileName(file.name || (isImage ? 'image' : 'file'));
  const path = `chat-files/${chatId}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);

  const snapshot = await uploadBytesResumable(storageRef, file).then(s => s);
  const downloadURL = await getDownloadURL(snapshot.ref);

  // return just the meta; DO NOT write message here
  return {
    url: downloadURL,
    fileName: safeName,
    fileSize: file.size,
    type: isImage ? 'image' : 'file',
  };
};





// // ✅ FREE METHOD - No storage rules needed!
// export const uploadAvatar = async (userId, file, onProgress = null) => {
//   try {
//     if (!userId || !file) {
//       throw new Error('User ID and file are required');
//     }

//     // Validate file
//     const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
//     if (!allowedTypes.includes(file.type)) {
//       throw new Error('Please upload a valid image file');
//     }

//     // File size check (max 2MB for free)
//     if (file.size > 2 * 1024 * 1024) {
//       throw new Error('File size must be less than 2MB');
//     }

//     console.log('Starting FREE avatar upload...');

//     // Create simple path
//     const timestamp = Date.now();
//     const extension = file.name.split('.').pop();
//     const fileName = `avatar_${timestamp}.${extension}`;
//     const path = `avatars/${userId}/${fileName}`;

//     const storageRef = ref(storage, path);

//     // Direct upload with minimal metadata
//     console.log('Trying direct upload...');

//     const snapshot = await uploadBytes(storageRef, file, {
//       contentType: file.type,
//       customMetadata: {
//         'uploaded-by': userId,
//         'upload-time': timestamp.toString()
//       }
//     });

//     const downloadURL = await getDownloadURL(snapshot.ref);
//     console.log('✅ Direct upload successful!', downloadURL);

//     return downloadURL;

//   } catch (error) {
//     console.error('Upload failed:', error);

//     // User friendly error messages
//     if (error.code === 'storage/unauthorized') {
//       throw new Error('Please login again and try uploading.');
//     } else if (error.message.includes('CORS')) {
//       throw new Error('Upload failed. Please try again or use a different browser.');
//     } else {
//       throw new Error(`Upload failed: ${error.message}`);
//     }
//   }
// };






// Real-time listeners
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

export default app;
