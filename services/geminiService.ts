import { GoogleGenAI } from "@google/genai";

// Ideally, this comes from an environment variable. 
// For this demo, we assume the environment has it or we handle the missing key gracefully.
const API_KEY = process.env.API_KEY || ''; 

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export const generateBirthdayWish = async (): Promise<string> => {
  if (!ai) {
    console.warn("Gemini API Key missing");
    return "Happy 21st Birthday! Have a blast!"; // Fallback
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Write a short, fun, punchy 21st birthday wish. Max 50 characters. No quotes.",
      config: {
        maxOutputTokens: 30,
        temperature: 1.2, // High creativity
      }
    });
    
    return response.text.trim().substring(0, 50);
  } catch (error) {
    console.error("Failed to generate wish:", error);
    return "Cheers to 21 years! 🥂";
  }
};