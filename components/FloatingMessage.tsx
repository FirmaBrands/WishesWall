import React, { useState, useEffect } from 'react';
import { Message } from '../types';

interface FloatingMessageProps {
  message: Message;
}

const FloatingMessage: React.FC<FloatingMessageProps> = ({ message }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // This creates the "Pop In" animation
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 1. EXTRACT STYLES SENT FROM PHONE
  // If message.font is empty, default to 'font-syne'
  const fontClass = message.font || 'font-syne';
  
  // If message.color is empty, default to 'text-white'
  const colorClass = message.color || 'text-white';

  // 2. POSITIONING STYLE
  const style = {
    left: `${message.x}%`,
    top: `${message.y}%`,
    transform: `translate(-50%, -50%) rotate(${message.rotation || 0}deg) scale(${visible ? message.scale || 1 : 0})`,
    opacity: visible ? 1 : 0,
    transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s ease-out',
    position: 'absolute' as 'absolute',
    maxWidth: '350px',
    width: 'max-content',
    zIndex: Math.floor(Math.random() * 50)
  };

  return (
    <div 
      style={style}
      // 3. APPLY THE CLASSES HERE
      className={`absolute text-4xl md:text-6xl font-bold leading-tight drop-shadow-lg text-center pointer-events-none select-none ${fontClass} ${colorClass}`}
    >
      {message.text}
      
      {/* Optional Author Name */}
      {message.author && message.author !== 'Guest' && (
        <div className="text-sm md:text-base mt-2 opacity-90 font-sans text-white tracking-widest uppercase">
          - {message.author}
        </div>
      )}
    </div>
  );
};

export default FloatingMessage;
