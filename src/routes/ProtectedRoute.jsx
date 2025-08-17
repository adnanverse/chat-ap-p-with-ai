import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, createUserDocument, updateUserStatus, listenToUser } from '../utils/firebaseConfig';
import Loader from '../components/common/Loader';

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let unsubscribeUser = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        try {
          // Create user document if it doesn't exist
          await createUserDocument(user);

          // ✅ Realtime listener for user document
          unsubscribeUser = listenToUser(user.uid, (userData) => {
            const formattedData = {
              uid: user.uid,
              ...userData,
            };

            // Convert Firestore timestamps
            if (formattedData.lastSeen?.toDate) {
              formattedData.lastSeen = formattedData.lastSeen.toDate();
            }
            if (formattedData.createdAt?.toDate) {
              formattedData.createdAt = formattedData.createdAt.toDate();
            }

            setCurrentUser(formattedData);
          });

          // ✅ Online status ek hi baar set karo yaha
          await updateUserStatus(user.uid, true);

          setUser(user);
        } catch (error) {
          console.error('Error setting up user:', error);
        }
      } else {
        setUser(null);
        setCurrentUser(null);
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser(); // cleanup listener
    };
  }, []);

  // Update user status when component unmounts
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentUser?.uid) {
        await updateUserStatus(currentUser.uid, false);
      }
    };

    const handleVisibilityChange = async () => {
      if (currentUser?.uid) {
        if (document.hidden) {
          await updateUserStatus(currentUser.uid, false);
        } else {
          await updateUserStatus(currentUser.uid, true);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (currentUser?.uid) {
        updateUserStatus(currentUser.uid, false);
      }
    };
  }, [currentUser?.uid]);

  if (loading) {
    return <Loader message="Checking authentication..." fullScreen />;
  }

  if (!user || !currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Clone children with user props
  return React.cloneElement(children, { currentUser, user });
};
