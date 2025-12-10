import React, { useState, useEffect } from 'react';
import { Message } from '../types';

interface FloatingMessageProps {
  message: Message;
}

const FloatingMessage: React.FC<FloatingMessageProps> = ({ message }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // --- 🛡️ SAFETY NETS (Fixes the "Broken Position" issue) ---
  // If X or Y is missing (from old messages), pick a random spot instantly.
  // This prevents them from stacking in the corner.
  const safeX = message.x ?? Math.random() * 90 + 5;
  const safeY = message.y ?? Math.random() * 70 + 15;
  
  const fontClass = message.font || 'font-syne';
  const colorClass = message.color || 'text-white';
  const rotation = message.rotation || 0;

  const style = {
    left: `${safeX}%`,  // Use the safe variable
    top: `${safeY}%`,   // Use the safe variable
    transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${visible ? message.scale || 1 : 0})`,
    opacity: visible ? 1 : 0,
    transition: 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.6s ease-out',
    maxWidth: '300px',
    width: 'max-content',
    position: 'absolute' as 'absolute',
    zIndex: Math.floor(Math.random() * 10),
    whiteSpace: 'pre-wrap' as 'pre-wrap', // Ensures text wraps if too long
    textAlign: 'center' as 'center'
  };

  return (
    <div 
      style={style}
      className={`
        absolute text-3xl md:text-5xl font-bold leading-tight drop-shadow-lg text-center pointer-events-none select-none
        ${fontClass} 
        ${colorClass}
      `}
    >
      {message.text}
      
      {message.author && message.author !== 'Guest' && (
        <div className="text-sm md:text-base mt-1 opacity-80 font-sans text-white tracking-widest uppercase">
          - {message.author}
        </div>
      )}
    </div>
  );
};

export default FloatingMessage;
