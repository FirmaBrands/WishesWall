import React, { useEffect, useState, useRef } from 'react';
import { Message } from '../types';
import { fetchMessages, subscribeToMessages, clearMessages, subscribeToReset, getApiUrl, setApiUrl } from '../services/messageService';
import FloatingMessage from './FloatingMessage';
import { getRandomColor, getRandomFont, getRandomRotation, getRandomScale, getSmartPosition } from '../utils/random';

const DisplayView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupUrl, setSetupUrl] = useState('');
  
  // Viewport State
  const [globalScale, setGlobalScale] = useState(1);
  const [fontScale, setFontScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  // Initial Load & Connection
  useEffect(() => {
    if (!getApiUrl()) {
      setNeedsSetup(true);
      return;
    }

    const loadInitial = async () => {
      const initialMsgs = await fetchMessages();
      // Process initial messages to ensure they have visuals
      setMessages(prev => processNewMessages(initialMsgs, prev));
    };
    loadInitial();

    const unsubscribeMessages = subscribeToMessages((newMessage) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return processNewMessages([newMessage], prev);
      });
    });

    const unsubscribeReset = subscribeToReset(() => {
      setMessages([]);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeReset();
    };
  }, [needsSetup]);

  // Logic to assign visuals if missing (Collision Aware)
  const processNewMessages = (newMsgs: Message[], currentMsgs: Message[]) => {
    let updatedList = [...currentMsgs];
    
    // Filter out messages that are already in the list
    const uniqueNew = newMsgs.filter(n => !currentMsgs.some(c => c.id === n.id));

    uniqueNew.forEach(msg => {
      // If message already has valid coordinates (from Sheet), keep them.
      // Otherwise, generate new ones.
      const hasCoords = typeof msg.x === 'number' && typeof msg.y === 'number';
      
      const visuals = hasCoords ? {} : {
        ...getSmartPosition(updatedList), // Check collision against currently built list
        color: getRandomColor(),
        font: getRandomFont(),
        rotation: getRandomRotation(),
        scale: getRandomScale()
      };

      updatedList.push({ ...msg, ...visuals });
    });

    return updatedList;
  };

  // --- Handlers ---

  const handleSaveSetup = () => {
    if (!setupUrl.includes('script.google.com')) {
      alert("That doesn't look like a Google Script URL.");
      return;
    }
    setApiUrl(setupUrl);
    setNeedsSetup(false);
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      await clearMessages();
      setMessages([]);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Disconnect from this Google Sheet?')) {
      setApiUrl('');
      setNeedsSetup(true);
    }
  };

  // Dragging Message
  const handleMessagePositionChange = (id: string, x: number, y: number) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, x, y } : m));
  };

  // Panning Background
  const handlePanStart = (e: React.PointerEvent) => {
    // Only pan if clicking on background (target is the container)
    if (e.target === e.currentTarget) {
      setIsPanning(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };
  
  const handlePanMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handlePanEnd = (e: React.PointerEvent) => {
    setIsPanning(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Setup Screen
  if (needsSetup) {
    return (
      <SetupScreen 
        setupUrl={setupUrl} 
        setSetupUrl={setSetupUrl} 
        onSave={handleSaveSetup} 
      />
    );
  }

  // QR Generation
  const appBaseUrl = window.location.href.split('#')[0];
  const guestUrl = `${appBaseUrl}?apiUrl=${encodeURIComponent(getApiUrl() || '')}#/`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(guestUrl)}&bgcolor=ffffff&color=000000&margin=10&format=svg`;

  return (
    <div className="relative w-screen h-screen bg-firma-dark overflow-hidden selection:bg-firma-pink selection:text-white">
      
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-firma-pink/20 rounded-full blur-[120px] animate-blob mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-firma-pink/10 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen pointer-events-none"></div>
      
      {/* Noise */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* Viewport / Canvas */}
      <div 
        className={`absolute inset-0 w-full h-full perspective-[1000px] touch-none ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
        onPointerDown={handlePanStart}
        onPointerMove={handlePanMove}
        onPointerUp={handlePanEnd}
      >
        <div 
          className="absolute inset-0 w-full h-full transition-transform duration-75 origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${globalScale})`
          }}
        >
          {messages.map((msg) => (
            <FloatingMessage 
              key={msg.id} 
              message={msg} 
              globalScale={globalScale}
              globalFontScale={fontScale}
              onPositionChange={handleMessagePositionChange}
              enableDrag={true}
            />
          ))}
        </div>
      </div>

      {/* Empty State */}
      {messages.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="text-firma-pink/50 text-9xl font-syne font-extrabold animate-pulse opacity-20">21</div>
          <div className="text-gray-500 text-sm font-grotesk uppercase tracking-[0.5em] mt-4">Waiting for messages</div>
        </div>
      )}

      {/* Brand Header */}
      <div className="absolute top-8 left-8 z-50 pointer-events-none">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-firma-pink flex items-center justify-center text-black font-syne font-bold text-xl clip-path-polygon">F</div>
            <h1 className="text-2xl font-syne font-bold uppercase tracking-widest text-white">Firma</h1>
         </div>
      </div>

      {/* QR & Footer */}
      <div className="absolute bottom-8 right-8 z-40 flex items-end gap-6 bg-firma-dark/80 backdrop-blur-sm p-4 border border-gray-800/50 rounded-lg pointer-events-auto">
        <div className="text-right">
          <p className="text-sm font-grotesk text-gray-400 mb-1">Join the Party</p>
          <div className="text-white font-bold font-syne text-xl">Scan to Send</div>
        </div>
        <div className="bg-white p-2 w-[140px] h-[140px] shrink-0">
          <img src={qrCodeUrl} alt="Scan to send" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* UI Controls Toggle */}
      <button 
        onClick={() => setShowControls(!showControls)}
        className="absolute top-8 right-8 z-50 text-gray-500 hover:text-white transition-colors p-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 18H7.5M3.75 12h18" />
        </svg>
      </button>

      {/* Control Panel Overlay */}
      {showControls && (
        <div className="absolute top-20 right-8 z-50 w-64 bg-gray-900/90 backdrop-blur-md border border-gray-800 p-6 shadow-2xl rounded-sm animate-fade-in text-xs font-grotesk uppercase tracking-wider">
          <h3 className="text-white font-bold mb-4 border-b border-gray-700 pb-2">Wall Controls</h3>
          
          <div className="mb-6">
            <label className="block text-gray-400 mb-2 flex justify-between">
              <span>Zoom</span>
              <span>{Math.round(globalScale * 100)}%</span>
            </label>
            <input 
              type="range" min="0.5" max="3" step="0.1" 
              value={globalScale} 
              onChange={(e) => setGlobalScale(Number(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-firma-pink"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-400 mb-2 flex justify-between">
              <span>Text Size</span>
              <span>{Math.round(fontScale * 100)}%</span>
            </label>
            <input 
              type="range" min="0.5" max="3" step="0.1" 
              value={fontScale} 
              onChange={(e) => setFontScale(Number(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-firma-pink"
            />
          </div>

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-700">
             <button 
               onClick={() => { setPan({x:0,y:0}); setGlobalScale(1); setFontScale(1); }}
               className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white transition-colors"
             >
               Reset View
             </button>
             <button onClick={handleReset} className="w-full py-2 bg-gray-800 hover:bg-red-900/50 text-red-400 hover:text-red-200 transition-colors">
               Clear Messages
             </button>
             <button onClick={handleDisconnect} className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
               Disconnect
             </button>
          </div>
        </div>
      )}

    </div>
  );
};

// Extracted Setup Component
const SetupScreen: React.FC<{ setupUrl: string, setSetupUrl: (s: string) => void, onSave: () => void }> = ({ setupUrl, setSetupUrl, onSave }) => (
  <div className="w-screen h-screen bg-firma-dark flex items-center justify-center p-8 text-white font-grotesk overflow-y-auto">
    <div className="max-w-3xl w-full bg-gray-900 border border-gray-800 p-12 shadow-2xl">
      <div className="w-12 h-12 bg-firma-pink flex items-center justify-center text-black font-syne font-bold text-xl mb-6">F</div>
      <h1 className="text-3xl font-syne font-bold mb-4 uppercase text-white">Connect Google Sheets</h1>
      <div className="space-y-4 mb-8 text-gray-400 text-sm leading-relaxed">
        <p>To let guests send messages from their phones to this screen, we need a simple backend.</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Open the file <code>BACKEND_CODE.js</code> in this project and copy all the code.</li>
          <li>Go to <a href="https://sheets.new" target="_blank" className="text-firma-pink hover:underline">sheets.new</a> to create a Google Sheet.</li>
          <li>In the Sheet, go to <strong>Extensions &gt; Apps Script</strong>.</li>
          <li>Paste the code, then click <strong>Deploy &gt; New Deployment</strong>.</li>
          <li>Select <strong>Web App</strong>, set "Who has access" to <strong>Anyone</strong>, and click Deploy.</li>
          <li>Copy the <strong>Web App URL</strong> and paste it below.</li>
        </ol>
      </div>
      <input 
        type="text" 
        placeholder="Paste Web App URL here (https://script.google.com/...)"
        value={setupUrl}
        onChange={(e) => setSetupUrl(e.target.value)}
        className="w-full bg-black border border-gray-700 p-4 text-white font-mono text-sm focus:border-firma-pink focus:outline-none mb-6 transition-colors"
      />
      <button onClick={onSave} className="bg-white text-black font-syne font-bold px-8 py-3 uppercase hover:bg-firma-pink hover:text-white transition-colors">Connect & Start</button>
    </div>
  </div>
);

export default DisplayView;