import React from 'react'

export default function Loader({ 
  message = 'Loading...', 
  size = 'medium',
  type = 'spinner',
  className = '',
  fullScreen = false 
}) {
// Size configurations
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  // Spinner component
  const Spinner = ({ size, className: spinnerClass = '' }) => (
    <div className={`
      ${sizeClasses[size]} 
      border-2 border-blue-500 border-t-transparent 
      rounded-full animate-spin
      ${spinnerClass}
    `}></div>
  );

  // Dots component
  const Dots = ({ size }) => {
    const dotSize = {
      small: 'w-1 h-1',
      medium: 'w-2 h-2',
      large: 'w-3 h-3',
      xlarge: 'w-4 h-4'
    };

    return (
      <div className="flex space-x-1">
        <div className={`${dotSize[size]} bg-blue-500 rounded-full animate-bounce`}></div>
        <div className={`${dotSize[size]} bg-blue-500 rounded-full animate-bounce`} style={{animationDelay: '0.1s'}}></div>
        <div className={`${dotSize[size]} bg-blue-500 rounded-full animate-bounce`} style={{animationDelay: '0.2s'}}></div>
      </div>
    );
  };

  // ChatApp branded loader
  const ChatAppLoader = () => (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 flex items-center justify-center animate-pulse">
        <span className="text-white text-2xl font-bold">💬</span>
      </div>
      <Spinner size="medium" />
    </div>
  );

  // Render loader type
  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return <Dots size={size} />;
      case 'chatapp':
        return <ChatAppLoader />;
      case 'spinner':
      default:
        return <Spinner size={size} />;
    }
  };

  // Base loader content
  const LoaderContent = () => (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {renderLoader()}
      {message && (
        <p className="text-gray-600 text-sm text-center max-w-xs">
          {message}
        </p>
      )}
    </div>
  );

  // Full screen loader
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <LoaderContent />
      </div>
    );
  }

  // Regular loader
  return <LoaderContent />;
};

// Specialized loader components
export const MessageLoader = () => (
  <Loader 
    type="dots" 
    size="small" 
    message="" 
    className="py-2"
  />
);

export const PageLoader = ({ message = 'Loading page...' }) => (
  <Loader 
    type="chatapp" 
    message={message}
    fullScreen={true}
  />
);

export const ButtonLoader = ({ size = 'small' }) => (
  <div className={`
    ${size === 'small' ? 'w-4 h-4' : size === 'medium' ? 'w-5 h-5' : 'w-6 h-6'} 
    border-2 border-white border-t-transparent 
    rounded-full animate-spin
  `}></div>
);