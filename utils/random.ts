import { Message } from '../types';

// Firma Brand Palette
export const getRandomColor = () => {
  const colors = [
    'text-white', 
    'text-white', 
    'text-white', // Weighted towards white for readability
    'text-firma-pink', 
    'text-firma-pink', 
    'text-gray-300'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getRandomFont = () => {
  const fonts = [
    'font-syne font-extrabold', 
    'font-grotesk font-light',
    'font-serif italic',        
    'font-anton uppercase tracking-wider', 
    'font-inter font-black tracking-tighter'
  ];
  return fonts[Math.floor(Math.random() * fonts.length)];
};

export const getRandomRotation = () => {
  // Occasional slight tilt for that "zine" look
  return (Math.random() - 0.5) * 8; 
};

export const getRandomScale = () => {
  // Reduced scale to make them smaller by default as requested
  // 0.6 is quite small, 1.5 is large
  return 0.6 + Math.random() * 0.9;
};

// Pure random position
const getRawRandomPosition = () => {
  return {
    x: 10 + Math.random() * 80, // Keep within 10-90% to avoid edge clipping
    y: 10 + Math.random() * 80
  };
};

// Collision-aware positioning
export const getSmartPosition = (existingMessages: Message[]) => {
  const maxAttempts = 50;
  const collisionThreshold = 10; // Approximate % distance

  for (let i = 0; i < maxAttempts; i++) {
    const candidate = getRawRandomPosition();
    
    // Check collision with all existing messages
    const hasCollision = existingMessages.some(msg => {
      // If message doesn't have visuals yet, skip it
      if (typeof msg.x !== 'number' || typeof msg.y !== 'number') return false;
      
      const dx = Math.abs(msg.x - candidate.x);
      const dy = Math.abs(msg.y - candidate.y);
      
      // Simple box collision approximation
      // We assume horizontal shapes (text), so x threshold is wider than y
      return dx < (collisionThreshold * 1.5) && dy < collisionThreshold;
    });

    if (!hasCollision) {
      return candidate;
    }
  }

  // Fallback if crowded
  return getRawRandomPosition();
};