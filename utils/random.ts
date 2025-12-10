import { Message } from '../types';

// Firma Brand Palette & New Party Colors
export const getRandomColor = () => {
  const colors = [
    'text-white', 
    'text-white', // Keep some white for readability
    'text-party-pink', 
    'text-party-lime', 
    'text-party-purple',
    'text-party-teal',
    'text-party-red',
    'text-party-green',
    'text-party-orange'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// --- Font Management ---

const fontList = [
  // Expressive / Display
  'font-syne font-extrabold', 
  'font-anton uppercase tracking-wider', 
  'font-marker tracking-widest', 
  'font-playfair italic font-bold',
  'font-bebas tracking-wide text-gray-200',
  'font-amatic font-bold text-2xl', // Increased size for visibility
  'font-secular',

  // Modern / Clean
  'font-grotesk font-light',
  'font-inter font-black tracking-tighter',
  'font-montserrat font-black uppercase',
  'font-oswald uppercase font-bold',
  'font-raleway font-bold',
  'font-lato font-bold italic',
  'font-roboto font-black',
  'font-opensans font-extrabold',
  
  // Serif / Classic
  'font-serif italic',   
  'font-merriweather font-bold',
  'font-frank font-bold',

  // Soft / Rounded
  'font-varela',
  'font-rubik font-bold',
  'font-heebo font-black',
  'font-assistant font-extrabold',
];

// Fisher-Yates shuffle
const shuffleArray = (array: string[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Stateful font tracking
let availableFonts: string[] = [];
let currentFontIndex = 0;

export const getRandomFont = () => {
  // Initialize or Reset loop
  if (availableFonts.length === 0 || currentFontIndex >= availableFonts.length) {
    availableFonts = shuffleArray(fontList);
    currentFontIndex = 0;
  }

  const font = availableFonts[currentFontIndex];
  currentFontIndex++;
  return font;
};

// --- Other Randoms ---

export const getRandomRotation = () => {
  // Occasional slight tilt for that "zine" look
  return (Math.random() - 0.5) * 12; 
};

export const getRandomScale = () => {
  // Reduced scale to make them smaller by default (0.4 to 1.0)
  return 0.4 + Math.random() * 0.6;
};

// Pure random position
const getRawRandomPosition = () => {
  return {
    x: 5 + Math.random() * 90, // Keep within 5-95%
    y: 10 + Math.random() * 80
  };
};

// Collision-aware positioning (Legacy helper, mostly handled by Physics Engine now)
export const getSmartPosition = (existingMessages: Message[]) => {
  return getRawRandomPosition();
};