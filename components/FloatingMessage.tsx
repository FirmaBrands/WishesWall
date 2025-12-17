import React, { useEffect, useState, forwardRef } from 'react';
import { Message } from '../types';
import { parseFontConfig } from '../utils/random';

export type LineMode = 'compact' | 'full';

interface FloatingMessageProps {
  message: Message;
  style?: React.CSSProperties;
  lineMode?: LineMode;
}

const FloatingMessage = forwardRef<HTMLDivElement, FloatingMessageProps>(({ 
  message, 
  style,
  lineMode = 'compact'
}, ref) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Typewriter Effect
  useEffect(() => {
    let currentIndex = 0;
    const fullText = message.text;
    // Faster typing for longer texts
    const baseSpeed = 40;
    const typingSpeed = Math.max(10, baseSpeed - (fullText.length * 0.2)) + Math.random() * 20; 

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

  // Parse font config
  const fontConfig = parseFontConfig(message.font);
  
  // Dynamic Styles based on Line Mode
  const containerStyle: React.CSSProperties = {
    maxWidth: lineMode === 'full' ? '90vw' : '25em', // Compact: wider to allow ~2-3 words/line. Full: almost screen width.
    width: 'max-content',
    textAlign: 'center',
    lineHeight: 1.1,
    textShadow: '0 4px 12px rgba(0,0,0,0.5)',
    animation: `float-idle ${message.animationDuration || 8}s ease-in-out infinite alternate`,
  };

  const textStyle: React.CSSProperties = {
    whiteSpace: lineMode === 'full' ? 'nowrap' : 'pre-wrap',
    // In compact mode, we ensure it doesn't get TOO wide if it's a paragraph
    maxWidth: lineMode === 'full' ? 'none' : '30vw', 
    minWidth: lineMode === 'full' ? 'auto' : '200px', // Prevent squashing to 1 word
    // Apply font styles directly with appropriate fallback
    fontFamily: `'${fontConfig.fontFamily}', ${fontConfig.fallback || 'sans-serif'}`,
    fontWeight: fontConfig.fontWeight,
    fontStyle: fontConfig.fontStyle,
    textTransform: fontConfig.textTransform,
    letterSpacing: fontConfig.letterSpacing,
  };

  return (
    <div
      ref={ref}
      className={`absolute select-none will-change-transform`}
      style={{
        ...style,
        zIndex: 10,
        transformOrigin: 'center center',
      }}
    >
      <div 
        className={message.color || 'text-white'}
        style={containerStyle}
      >
        <div 
          dir="auto"
          className={`text-3xl md:text-5xl transition-opacity duration-300 ${isTyping ? 'cursor-blink' : ''}`}
          style={textStyle}
        >
          {displayedText}
        </div>
        
        {/* Author Display */}
        {message.author && message.author !== 'Guest' && !isTyping && (
          <div className="mt-2 text-sm md:text-base font-grotesk tracking-widest opacity-60 uppercase text-center w-full">
            - {message.author}
          </div>
        )}
      </div>
    </div>
  );
});

FloatingMessage.displayName = 'FloatingMessage';

export default FloatingMessage;