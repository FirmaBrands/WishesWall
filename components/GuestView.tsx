import React, { useState } from 'react';
import { Message } from '../types';

// IMPORTANT: Ensure this path matches your actual logo file location!
// If your logo is in public/WishesWall/logo.png, you might need to use that string in the src="" below instead of importing.
import logo from '../assets/logo.png'; 

export default function GuestView() {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // REPLACE THIS WITH YOUR GOOGLE SCRIPT URL
  const API_URL = "https://script.google.com/macros/s/AKfycby.../exec"; 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setSending(true);
    setStatus('idle');

    try {
      const newMessage = {
        id: crypto.randomUUID(),
        text: text,
        author: author || 'Guest',
        timestamp: Date.now(),
        // Visuals
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        color: ['#FF0055', '#008F7A', '#FFD700', '#FFFFFF'][Math.floor(Math.random() * 4)],
        font: ['font-syne', 'font-grotesk', 'font-anton', 'font-marker'][Math.floor(Math.random() * 4)],
        rotation: Math.random() * 20 - 10,
        scale: 1,
      };

      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', message: newMessage }),
      });

      setStatus('success');
      setText('');
      setAuthor('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Error sending:', error);
      setStatus('error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-firma-dark text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* BACKGROUND SHAPES */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-firma-pink/20 rounded-full blur-[100px] animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-firma-teal/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        
        {/* LOGO SECTION - FIXED SIZE HERE */}
        {/* We use w-1/2 for 50% width, and mx-auto to center it */}
        <img 
          src={logo} 
          alt="Event Logo" 
          className="w-1/2 h-auto mb-8 mx-auto drop-shadow-2xl"
        />

        <div className="w-full backdrop-blur-md bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl">
          <h1 className="text-3xl font-syne font-bold text-center mb-2 bg-gradient-to-r from-firma-pink to-white bg-clip-text text-transparent">
            Make a Wish
          </h1>
          <p className="text-center text-gray-400 mb-8 font-grotesk text-sm">
            Share your message for the big screen.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-firma-pink mb-2 ml-1">
                Your Message
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={50}
                placeholder="Type something amazing..."
                className="w-full bg-black/40 border-2 border-white/10 rounded-xl p-4 text-lg font-medium focus:border-firma-pink focus:outline-none focus:ring-4 focus:ring-firma-pink/20 transition-all resize-none placeholder-gray-600"
                rows={3}
              />
              <div className="text-right text-xs text-gray-500 mt-2">
                {text.length}/50
              </div>
            </div>

            <button
              type="submit"
              disabled={sending || !text}
              className={`w-full py-4 rounded-xl font-bold text-lg tracking-wide transition-all transform active:scale-95 ${
                status === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-firma-pink text-white hover:shadow-[0_0_30px_rgba(255,0,85,0.4)]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {sending ? 'Sending...' : status === 'success' ? 'Sent!' : 'SEND WISH'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
