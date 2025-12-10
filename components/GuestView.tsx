import React, { useState, useEffect } from 'react';
import { setApiUrl, getApiUrl } from '../services/messageService';

const GuestView: React.FC = () => {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // 🔴 PASTE YOUR GOOGLE SCRIPT URL HERE (Starts with https://script.google.com/...)
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
      // 🟢 THIS IS THE PART WE BROUGHT "OUT" OF HIDING
      // Now we can control the design!
      const newMessage = {
        id: crypto.randomUUID(),
        text: text.trim(),
        author: author.trim() || 'Guest',
        timestamp: Date.now(),
        
        // 1. WIDE SPREAD LOGIC (95% Width)
        x: Math.random() * 95 + 2.5, 
        y: Math.random() * 70 + 15,
        
        // 2. COLOR LOGIC (Using the Class Names from your index.html)
        color: [
          'text-party-pink', 
          'text-party-lime', 
          'text-party-purple', 
          'text-party-teal',
          'text-party-orange',
          'text-white'
        ][Math.floor(Math.random() * 6)],

        // 3. FONT LOGIC (Using the Fonts from your index.html)
        font: [
          'font-syne', 
          'font-grotesk', 
          'font-anton', 
          'font-marker', 
          'font-bebas'
        ][Math.floor(Math.random() * 5)],

        rotation: Math.random() * 20 - 10,
        scale: 1,
      };

      // Send to Google Sheets
      const targetUrl = getApiUrl() || FALLBACK_URL;
      
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', message: newMessage }),
      });

      setIsSending(false);
      setSent(true);
      setText('');
      setAuthor('');
    } catch (error) {
      console.error("Error sending:", error);
      setIsSending(false);
      // Optional: Add error handling here
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-firma-dark text-center animate-fade-in relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-firma-pink/20 rounded-full blur-[80px]"></div>
        <h2 className="text-6xl font-syne font-extrabold text-white mb-6 relative z-10">Sent!</h2>
        <p className="font-grotesk text-gray-400 mb-8 relative z-10">Your message is now on the wall.</p>
        <button onClick={() => setSent(false)} className="px-8 py-4 bg-firma-pink text-white font-syne font-bold text-sm uppercase tracking-widest hover:bg-white hover:text-firma-pink transition-all relative z-10 rounded-lg">
          Send Another
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-8 bg-firma-dark text-white relative overflow-hidden">
      <div className="absolute top-[-100px] right-[-100px] w-[200px] h-[200px] bg-firma-pink rounded-full blur-[60px] opacity-40"></div>

      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full relative z-10">
        
        <header className="mb-10 text-center flex flex-col items-center">
          
          {/* SAFE LOGO LOAD */}
          <div className="mb-8">
             <img 
               src="/WishesWall/logo.png"
               alt="Event Logo" 
               className="w-1/2 h-auto mb-8 mx-auto"
               onError={(e) => { e.currentTarget.style.display = 'none'; }} 
             />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-syne font-extrabold leading-none tracking-tight mb-2 uppercase">
            Send a <span className="text-firma-pink">Wish.</span>
          </h1>
          <p className="text-sm font-grotesk text-gray-400 mt-2">
            Leave a message for the birthday celebration.
          </p>
          
          {!isConnected && !FALLBACK_URL && (
            <div className="mt-6 p-4 bg-gray-800 border-l-4 border-yellow-500 text-gray-300 text-xs font-mono rounded-r-lg text-left">
              <strong className="text-yellow-500 block mb-1">⚠ Offline Mode</strong>
              Messages will not save to the screen.
            </div>
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 50))}
              placeholder="Write your message..."
              dir="auto"
              className="w-full h-32 bg-transparent border-2 border-gray-700 focus:border-firma-pink p-4 text-2xl font-syne font-bold text-white placeholder-gray-700 focus:outline-none transition-colors resize-none rounded-xl"
            />
            <div className="flex justify-between mt-2 px-1">
               <span className="text-xs font-mono text-gray-600 uppercase">Max 50 chars</span>
               <span className={`text-xs font-mono ${text.length >= 45 ? 'text-firma-pink' : 'text-gray-600'}`}>{text.length} / 50</span>
            </div>
          </div>

          <div className="relative">
             <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value.slice(0, 20))}
                placeholder="From: (Optional)"
                dir="auto"
                className="w-full bg-transparent border-2 border-gray-700 focus:border-firma-pink p-4 text-lg font-grotesk text-white placeholder-gray-700 focus:outline-none transition-colors rounded-xl"
             />
          </div>

          <button type="submit" disabled={!text || isSending} className="w-full py-5 mt-4 bg-white text-black font-syne font-black text-lg uppercase tracking-widest hover:bg-firma-pink hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-all rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,0,85,0.4)]">
            {isSending ? 'Sending...' : 'Send Wish'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GuestView;
