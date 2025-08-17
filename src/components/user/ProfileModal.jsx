import React, { useState } from 'react';
import { FiX, FiCamera, FiUser, FiMail, FiPhone, FiMessageSquare } from 'react-icons/fi';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db, uploadAvatar } from '../../utils/firebaseConfig.js';
import UserAvatar from './UserAvatar';
import { ButtonLoader } from '../common/Loader.jsx';
export default function ProfileModal({ isOpen, onClose, currentUser, onUpdate }) {
   const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    bio: currentUser?.bio || 'Hey there! I am using ChatApp.',
    phone: currentUser?.phone || '',
    email: currentUser?.email || ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentUser?.photoURL || null);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile picture change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
// const handleSubmit = async (e) => {
//   e.preventDefault();
//   setIsLoading(true);

//   try {
//     let photoURL = currentUser?.photoURL;

//     if (selectedFile) {
//       console.log('Uploading avatar...');
      
//       try {
//         // Try Firebase first
//         photoURL = await uploadAvatar(currentUser.uid, selectedFile, (progress) => {
//           console.log(`Upload progress: ${progress}%`);
//         });
//       } catch (firebaseError) {
//         console.log('Firebase failed, trying ImgBB...');
        
//         // Fallback to ImgBB
//         photoURL = await uploadAvatarImgBB(selectedFile, (progress) => {
//           console.log(`ImgBB progress: ${progress}%`);
//         });
//       }
//     }

//     // Rest of your update code...
    
//   } catch (error) {
//     alert(`Upload failed: ${error.message}`);
//   } finally {
//     setIsLoading(false);
//   }
// };
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    let photoURL = currentUser?.photoURL;

    if (selectedFile) {
      photoURL = await uploadAvatar(currentUser.uid, selectedFile);
    }

    // Update user document in Firestore
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
      displayName: formData.displayName,
      bio: formData.bio,
      phone: formData.phone,
      photoURL
    });

    // Update Firebase Auth profile (optional)
    await updateProfile(auth.currentUser, {
      displayName: formData.displayName,
      photoURL
    });

    // Update UI
    onUpdate && onUpdate({ ...formData, photoURL });
    onClose();
  } catch (error) {
    alert(`Update failed: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Profile Picture */}
            <div className="mb-6 text-center">
              <div className="relative inline-block">
                <UserAvatar
                  src={previewUrl}
                  name={formData.displayName}
                  size="xlarge"
                />
                <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                  <FiCamera size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">Click camera to change photo</p>
            </div>

            {/* Display Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiUser className="inline mr-2" size={16} />
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Your display name"
              />
            </div>

            {/* Bio */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiMessageSquare className="inline mr-2" size={16} />
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={isLoading}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiPhone className="inline mr-2" size={16} />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Your phone number"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiMail className="inline mr-2" size={16} />
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                placeholder="Email cannot be changed"
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <ButtonLoader size="small" />
                    <span className="ml-2">Saving...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};