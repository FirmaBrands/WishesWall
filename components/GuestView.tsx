import React, { useState, useEffect } from 'react';
import { setApiUrl, getApiUrl } from '../services/messageService';

const GuestView: React.FC = () => {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // 🔴 PASTE YOUR GOOGLE SCRIPT URL HERE
  const FALLBACK_URL = "https://script.google.com/macros/s/AKfycbx63gOFl6eifs0nvYnMsgpXdCJ9xspFQq9765fUUW8y2SC_p6P7uNuYKk1CCn-h3nWO/exec"; 

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const apiUrlFromQr = params.get('apiUrl');
    
    if (apiUrlFromQr) {
      setApiUrl(apiUrlFromQr);
      window.history.replaceState({}, '', window.location.pathname + '#/');
    }

    setIsConnected(!!getApiUrl() || !!FALLBACK_URL);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSending(true);

    try {
      const newMessage = {
        id: crypto.randomUUID(),
        text: text.trim(),
        author: author.trim() || 'Guest',
        timestamp: Date.now(),
        
        // --- 1. SPREAD LOGIC (Wide Cloud) ---
        x: Math.random() * 95 + 2.5, 
        y: Math.random() * 70 + 15,
        
        // --- 2. COLOR FIX (Using Class Names, NOT Hex Codes) ---
        // These match the definitions in your index.html
        color: [
          'text-firma-pink', 
          'text-firma-teal', 
          'text-party-lime', 
          'text-party-purple', 
          'text-party-orange',
          'text-white'
        ][Math.floor(Math.random() * 6)],

        // --- 3. FONT FIX ---
        font: [
          'font-syne', 
          'font-grotesk', 
          'font-anton', 
          'font-marker', 
          'font-bebas'
        ][Math.floor(Math.random() * 5)],

        rotation: Math.random() * 20 - 10,
        scale: Math.random() * 0.5 + 0.8, // Slight size variation
      };

      const targetUrl = getApiUrl() || FALLBACK_URL;

      if (!targetUrl || targetUrl.includes("YOUR_GOOGLE_SCRIPT")) {
        alert("Please set the Google Script URL in the code.");
        setIsSending(false);
        return;
      }

      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', message: newMessage }),
      });

      setSent(true);
      setText('');
      setAuthor('');
    } catch (error) {
      console.error("Error sending:", error);
      alert("Failed to send.");
    } finally {
      setIsSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-black text-center animate-fade-in relative overflow-hidden">
        <h2 className="text-6xl font-bold text-white mb-6 relative z-10">Sent!</h2>
        <p className="text-gray-400 mb-8 relative z-10">Your message is on the wall.</p>
        <button onClick={() => setSent(false)} className="px-8 py-4 bg-pink-600 text-white font-bold uppercase hover:bg-white hover:text-pink-600 transition-all rounded-lg z-10">
          Send Another
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-8 bg-black text-white relative overflow-hidden">
      <div className="absolute top-[-100px] right-[-100px] w-[200px] h-[200px] bg-pink-600 rounded-full blur-[60px] opacity-40"></div>

      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full relative z-10">
        <header className="mb-10 text-center flex flex-col items-center">
          <div className="mb-8">
             <img 
               src="/WishesWall/logo.png"
               alt="Event Logo" 
               className="w-1/2 h-auto mb-8 mx-auto"
               onError={(e) => { e.currentTarget.style.display = 'none'; }} 
             />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-none tracking-tight mb-2 uppercase">
            Send a <span className="text-pink-600">Wish.</span>
          </h1>
          <p className="text-sm text-gray-400 mt-2">Leave a message for the birthday celebration.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 50))}
              placeholder="Write your message..."
              className="w-full h-32 bg-transparent border-2 border-gray-700 focus:border-pink-600 p-4 text-2xl font-bold text-white placeholder-gray-700 focus:outline-none transition-colors resize-none rounded-xl"
            />
            <div className="flex justify-between mt-2 px-1">
               <span className="text-xs text-gray-600 uppercase">Max 50 chars</span>
               <span className={`text-xs ${text.length >= 45 ? 'text-pink-600' : 'text-gray-600'}`}>{text.length} / 50</span>
            </div>
          </div>

          <div className="relative">
             <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value.slice(0, 20))}
                placeholder="From: (Optional)"
                className="w-full bg-transparent border-2 border-gray-700 focus:border-pink-600 p-4 text-lg text-white placeholder-gray-700 focus:outline-none transition-colors rounded-xl"
             />
          </div>

          <button type="submit" disabled={!text || isSending} className="w-full py-5 mt-4 bg-white text-black font-black text-lg uppercase tracking-widest hover:bg-pink-600 hover:text-white disabled:opacity-30 transition-all rounded-xl">
            {isSending ? 'Sending...' : 'Send Wish'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GuestView;
