import React, { useState, useEffect } from 'react';
import { saveMessage, setApiUrl, getApiUrl } from '../services/messageService';

const GuestView: React.FC = () => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check for API URL in URL params (from QR code)
    const params = new URLSearchParams(window.location.search);
    const apiUrlFromQr = params.get('apiUrl');
    
    if (apiUrlFromQr) {
      setApiUrl(apiUrlFromQr);
      // Clean URL so the user doesn't see the ugly token
      window.history.replaceState({}, '', window.location.pathname + '#/');
    }

    setIsConnected(!!getApiUrl());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSending(true);
    await saveMessage(text.trim());
    setIsSending(false);
    setSent(true);
    setText('');
  };

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-firma-dark text-center animate-fade-in relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-firma-pink/20 rounded-full blur-[80px]"></div>
        <h2 className="text-6xl font-syne font-extrabold text-white mb-6 relative z-10">Sent!</h2>
        <p className="font-grotesk text-gray-400 mb-8 relative z-10">Your message is now on the wall.</p>
        <button onClick={() => setSent(false)} className="px-8 py-4 bg-firma-pink text-white font-syne font-bold text-sm uppercase tracking-widest hover:bg-white hover:text-firma-pink transition-all relative z-10">
          Send Another
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-8 bg-firma-dark text-white relative overflow-hidden">
      <div className="absolute top-[-100px] right-[-100px] w-[200px] h-[200px] bg-firma-pink rounded-full blur-[60px] opacity-40"></div>

      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full relative z-10">
        
        <header className="mb-12">
          <div className="w-12 h-12 bg-white flex items-center justify-center text-black font-syne font-bold text-2xl mb-6">F</div>
          <h1 className="text-5xl font-syne font-extrabold leading-[0.9] tracking-tight mb-2">
            SEND A<br /><span className="text-firma-pink">WISH.</span>
          </h1>
          <p className="text-sm font-grotesk text-gray-400 mt-4">
            Leave a message for the birthday celebration.
          </p>
          
          {!isConnected && (
            <div className="mt-6 p-4 bg-gray-800 border-l-4 border-yellow-500 text-gray-300 text-xs font-mono">
              <strong className="text-yellow-500 block mb-1">⚠ Offline Mode</strong>
              Messages will only be saved on this device. Scan the QR code on the main screen to connect to the live wall.
            </div>
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative group">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 50))}
              placeholder="Write your message..."
              className="w-full h-40 bg-transparent border-2 border-gray-800 focus:border-firma-pink p-6 text-2xl font-syne font-bold text-white placeholder-gray-700 focus:outline-none transition-colors resize-none"
            />
            <div className="flex justify-between mt-2">
               <span className="text-xs font-mono text-gray-600 uppercase">Max 50 chars</span>
               <span className={`text-xs font-mono ${text.length >= 45 ? 'text-firma-pink' : 'text-gray-600'}`}>{text.length} / 50</span>
            </div>
          </div>

          <button type="submit" disabled={!text || isSending} className="w-full py-6 bg-white text-black font-syne font-black text-lg uppercase tracking-widest hover:bg-firma-pink hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-all">
            {isSending ? 'Sending...' : 'Send Wish'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GuestView;