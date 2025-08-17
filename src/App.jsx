import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import ChatRoom from './pages/ChatRoom';
import NotFoundPage from './pages/NotFoundPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';


export default function App() {
   return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected Routes */}
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <ChatRoom />
            </ProtectedRoute>
          } 
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/chat" replace />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage/>} />
      </Routes>
    </div>
  );
}