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
// Store font info as objects with fontFamily and CSS properties

interface FontConfig {
  fontFamily: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textTransform?: string;
  letterSpacing?: string;
  fallback?: 'sans-serif' | 'serif' | 'cursive';
}

const fontList: FontConfig[] = [
  // Expressive / Display
  { fontFamily: 'Syne', fontWeight: 800 },
  { fontFamily: 'Anton', textTransform: 'uppercase', letterSpacing: '0.1em' },
  { fontFamily: 'Permanent Marker', letterSpacing: '0.15em', fallback: 'cursive' },
  { fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: 700, fallback: 'serif' },
  { fontFamily: 'Bebas Neue', letterSpacing: '0.05em' },
  { fontFamily: 'Amatic SC', fontWeight: 700, fallback: 'cursive' },
  { fontFamily: 'Secular One' },

  // Modern / Clean
  { fontFamily: 'Space Grotesk', fontWeight: 300 },
  { fontFamily: 'Inter', fontWeight: 900, letterSpacing: '-0.02em' },
  { fontFamily: 'Montserrat', fontWeight: 900, textTransform: 'uppercase' },
  { fontFamily: 'Oswald', textTransform: 'uppercase', fontWeight: 700 },
  { fontFamily: 'Raleway', fontWeight: 700 },
  { fontFamily: 'Lato', fontWeight: 700, fontStyle: 'italic' },
  { fontFamily: 'Roboto', fontWeight: 900 },
  { fontFamily: 'Open Sans', fontWeight: 800 },
  
  // Serif / Classic
  { fontFamily: 'DM Serif Display', fontStyle: 'italic', fallback: 'serif' },
  { fontFamily: 'Merriweather', fontWeight: 700, fallback: 'serif' },
  { fontFamily: 'Frank Ruhl Libre', fontWeight: 700, fallback: 'serif' },

  // Soft / Rounded
  { fontFamily: 'Varela Round' },
  { fontFamily: 'Rubik', fontWeight: 700 },
  { fontFamily: 'Heebo', fontWeight: 900 },
  { fontFamily: 'Assistant', fontWeight: 800 },
  
  // Additional Variety Fonts
  { fontFamily: 'Poppins', fontWeight: 900, textTransform: 'uppercase' },
  { fontFamily: 'Nunito', fontWeight: 700 },
  { fontFamily: 'Comfortaa', fontWeight: 700 },
  { fontFamily: 'Righteous', letterSpacing: '0.05em' },
  { fontFamily: 'Lobster', fallback: 'cursive' },
  { fontFamily: 'Pacifico', fallback: 'cursive' },
  { fontFamily: 'Dancing Script', fontWeight: 700, fallback: 'cursive' },
  { fontFamily: 'Fredoka One', fallback: 'cursive' },
  { fontFamily: 'Kalam', fontWeight: 700 },
  { fontFamily: 'Satisfy', fallback: 'cursive' },
];

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Stateful font tracking
let availableFonts: FontConfig[] = [];
let currentFontIndex = 0;

export const getRandomFont = (): string => {
  // Initialize or Reset loop
  if (availableFonts.length === 0 || currentFontIndex >= availableFonts.length) {
    availableFonts = shuffleArray(fontList);
    currentFontIndex = 0;
  }

  const font = availableFonts[currentFontIndex];
  currentFontIndex++;
  // Return as JSON string to store in Message.font
  return JSON.stringify(font);
};

// Helper to parse font config from string
export const parseFontConfig = (fontString?: string): FontConfig => {
  if (!fontString) {
    return { fontFamily: 'Syne', fontWeight: 800 };
  }
  try {
    return JSON.parse(fontString);
  } catch {
    // Fallback for old format or invalid JSON
    return { fontFamily: 'Syne', fontWeight: 800 };
  }
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