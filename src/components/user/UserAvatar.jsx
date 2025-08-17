import React from 'react';

export default function UserAvatar({ 
  src, 
  name, 
  size = 'medium', 
  status, 
  onClick, 
  className = '' 
}) {
  // Size configurations
  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-16 h-16 text-lg',
    xlarge: 'w-24 h-24 text-2xl'
  };

  const statusSizes = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4',
    xlarge: 'w-6 h-6'
  };

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Generate background color based on name
  const getBackgroundColor = (name) => {
    if (!name) return 'bg-gray-500';
    
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    
    const index = name.length % colors.length;
    return colors[index];
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          flex 
          items-center 
          justify-center 
          font-semibold 
          text-white 
          overflow-hidden
          ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
          ${!src ? getBackgroundColor(name) : 'bg-gray-300'}
        `}
        onClick={onClick}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              const parent = e.target.parentNode;
              const fallback = parent.querySelector('.fallback-initials');
              if (fallback) {
                fallback.classList.remove('hidden');
              }
            }}
          />
        ) : null}
        
        {/* Fallback initials */}
        <span 
          className={`
            fallback-initials w-full h-full flex items-center justify-center
            ${src ? 'hidden' : 'flex'}
          `}
        >
          {getInitials(name)}
        </span>
      </div>

      {/* Status indicator */}
      {status && (
        <div
          className={`
            absolute 
            bottom-0 
            right-0 
            ${statusSizes[size]}
            ${statusColors[status] || statusColors.offline}
            rounded-full 
            border-2 
            border-white
          `}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
