import React, { useEffect, useState, useRef } from 'react';
import { Message } from '../types';

interface FloatingMessageProps {
  message: Message;
  globalScale: number;
  globalFontScale: number;
  onPositionChange: (id: string, x: number, y: number) => void;
  enableDrag: boolean;
}

const FloatingMessage: React.FC<FloatingMessageProps> = ({ 
  message, 
  globalScale, 
  globalFontScale,
  onPositionChange,
  enableDrag
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs for drag calculations
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const initialPosRef = useRef<{x: number, y: number} | null>(null);

  // Typewriter Effect
  useEffect(() => {
    let currentIndex = 0;
    const fullText = message.text;
    const typingSpeed = 40 + Math.random() * 40; 

    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsTyping(false), 3000);
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [message.text]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!enableDrag) return;
    e.preventDefault();
    e.stopPropagation(); // Prevent panning the background
    setIsDragging(true);
    
    // Capture starting mouse/touch position
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    // Capture starting item position
    initialPosRef.current = { x: message.x || 50, y: message.y || 50 };
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current || !initialPosRef.current) return;
    
    const deltaXPixels = e.clientX - dragStartRef.current.x;
    const deltaYPixels = e.clientY - dragStartRef.current.y;
    
    // Convert pixel delta to percentage of screen
    const deltaXPercent = (deltaXPixels / window.innerWidth) * 100;
    const deltaYPercent = (deltaYPixels / window.innerHeight) * 100;
    
    // Apply zoom factor correction (if zoomed in, movement needs to be scaled down)
    const correctedDeltaX = deltaXPercent / globalScale;
    const correctedDeltaY = deltaYPercent / globalScale;

    onPositionChange(
      message.id, 
      initialPosRef.current.x + correctedDeltaX, 
      initialPosRef.current.y + correctedDeltaY
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Skip rendering if no valid position
  if (typeof message.x !== 'number' || typeof message.y !== 'number') return null;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`absolute transition-transform duration-100 ease-out select-none ${message.font} ${message.color} ${enableDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
      style={{
        left: `${message.x}%`,
        top: `${message.y}%`,
        // Combine the message's individual rotation/scale with the global zoom/font settings
        transform: `translate(-50%, -50%) rotate(${message.rotation || 0}deg) scale(${(message.scale || 1) * globalFontScale})`,
        zIndex: isDragging ? 9999 : Math.floor((message.scale || 1) * 10),
        maxWidth: '30vw',
        textAlign: 'left',
        lineHeight: 1.1,
        textShadow: '0 4px 12px rgba(0,0,0,0.5)',
        // Only animate float if not being dragged
        animation: isDragging ? 'none' : 'float-idle 8s ease-in-out infinite'
      }}
    >
      <span className={`text-4xl md:text-6xl ${isTyping ? 'cursor-blink' : ''}`}>
        {displayedText}
      </span>
    </div>
  );
};

export default FloatingMessage;