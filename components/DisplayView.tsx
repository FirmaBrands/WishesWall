import React, { useEffect, useState, useRef } from 'react';
import { Message } from '../types';
import { fetchMessages, subscribeToMessages, clearMessages, subscribeToReset, getApiUrl, setApiUrl } from '../services/messageService';
import FloatingMessage, { LineMode } from './FloatingMessage';
import { getRandomColor, getRandomFont, getRandomRotation, getRandomScale } from '../utils/random';

// --- Default Physics Constants ---
const DEFAULT_REPULSION_RADIUS = 350; 
const REPULSION_STRENGTH = 2000;
const CENTER_GRAVITY = 0.005; 
const DAMPING = 0.96; 
const MAX_VELOCITY = 2.0; 

interface PhysicsBody {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  scale: number;
}

interface ViewConfig {
  speed: number;
  distance: number;
  lineMode: LineMode;
  manualZoom: number | null; // null implies auto-zoom
}

const DisplayView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupUrl, setSetupUrl] = useState('');
  
  // Configuration State
  const [config, setConfig] = useState<ViewConfig>({
    speed: 0.5, // Defaulting to half speed within 0-1 range
    distance: 1.0, // Multiplier for radius
    lineMode: 'compact',
    manualZoom: null 
  });
  
  // Use ref to access config inside physics loop without re-triggering effect
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  // Camera / Viewport State
  const [globalScale, setGlobalScale] = useState(1);
  const [showControls, setShowControls] = useState(false);
  
  // Physics State
  const bodiesRef = useRef<Map<string, PhysicsBody>>(new Map());
  const elementsRef = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const requestRef = useRef<number>();
  
  // Initial Load & Connection
  useEffect(() => {
    if (!getApiUrl()) {
      setNeedsSetup(true);
      return;
    }

    const loadInitial = async () => {
      const initialMsgs = await fetchMessages();
      const uniqueInitial = Array.from(new Map(initialMsgs.map(m => [m.id, m])).values());
      setMessages(prev => processNewMessages(uniqueInitial, prev));
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
      bodiesRef.current.clear();
    });

    return () => {
      unsubscribeMessages();
      unsubscribeReset();
    };
  }, [needsSetup]);

  // --- Physics Engine Loop ---
  useEffect(() => {
    const updatePhysics = () => {
      const time = performance.now();
      const { speed, distance, manualZoom } = configRef.current;
      
      const bodies: PhysicsBody[] = Array.from(bodiesRef.current.values());
      const count = bodies.length;
      
      const effectiveRadius = DEFAULT_REPULSION_RADIUS * distance;

      // 1. Calculate Forces
      for (let i = 0; i < count; i++) {
        const bodyA = bodies[i];
        let fx = 0;
        let fy = 0;

        // Repulsion
        for (let j = 0; j < count; j++) {
          if (i === j) continue;
          const bodyB = bodies[j];
          const dx = bodyA.x - bodyB.x;
          const dy = bodyA.y - bodyB.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);

          if (dist < effectiveRadius) {
            const force = REPULSION_STRENGTH / (dist || 1);
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
        }

        // Center Gravity
        const dynamicGravity = CENTER_GRAVITY / (1 + count * 0.05);
        fx -= bodyA.x * dynamicGravity;
        fy -= bodyA.y * dynamicGravity;

        // Brownian Drift
        const timeScale = time * 0.001 * speed; // Speed affects noise frequency
        const noiseX = Math.sin(bodyA.id.charCodeAt(0) + timeScale) * 0.15;
        const noiseY = Math.cos(bodyA.id.charCodeAt(0) + timeScale) * 0.15;
        fx += noiseX;
        fy += noiseY;

        // Apply Force
        bodyA.vx += fx * 0.05 * speed; // Speed affects acceleration
        bodyA.vy += fy * 0.05 * speed;
      }

      // 2. Update Positions
      let maxDist = 0; 

      for (const body of bodies) {
        body.vx *= DAMPING;
        body.vy *= DAMPING;

        const vel = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
        const limit = MAX_VELOCITY * speed;
        if (vel > limit) {
           body.vx = (body.vx / vel) * limit;
           body.vy = (body.vy / vel) * limit;
        }

        body.x += body.vx;
        body.y += body.vy;

        const dist = Math.sqrt(body.x * body.x + body.y * body.y);
        if (dist > maxDist) maxDist = dist;

        // Update DOM
        const el = elementsRef.current.get(body.id);
        if (el) {
          el.style.transform = `translate3d(${body.x}px, ${body.y}px, 0) translate(-50%, -50%) rotate(${body.rotation}deg) scale(${body.scale})`;
        }
      }

      // 3. Zoom Logic
      if (manualZoom !== null) {
        // Manual override
        setGlobalScale(prev => prev + (manualZoom - prev) * 0.1);
      } else {
        // Auto Zoom
        const viewportSize = Math.min(window.innerWidth, window.innerHeight);
        const padding = 200;
        const contentSize = (maxDist * 2) + padding;
        let targetScale = viewportSize / contentSize;
        targetScale = Math.min(Math.max(targetScale, 0.2), 1.2);
        setGlobalScale(prev => prev + (targetScale - prev) * 0.02);
      }

      requestRef.current = requestAnimationFrame(updatePhysics);
    };

    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [messages.length]); // Dependencies minimal to avoid restarting loop often

  // Setup New Messages
  const processNewMessages = (newMsgs: Message[], currentMsgs: Message[]) => {
    let updatedList = [...currentMsgs];
    const uniqueNew = newMsgs.filter(n => !currentMsgs.some(c => c.id === n.id));

    uniqueNew.forEach(msg => {
      const visuals = {
        color: msg.color || getRandomColor(),
        font: msg.font || getRandomFont(),
        rotation: msg.rotation !== undefined ? msg.rotation : getRandomRotation(),
        scale: msg.scale !== undefined ? msg.scale : getRandomScale(),
      };
      
      const fullMsg = { ...msg, ...visuals };
      updatedList.push(fullMsg);

      if (!bodiesRef.current.has(msg.id)) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 100;
        bodiesRef.current.set(msg.id, {
          id: msg.id,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: 100,
          rotation: visuals.rotation,
          scale: visuals.scale
        });
      }
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
      bodiesRef.current.clear();
      setGlobalScale(1);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Disconnect from this Google Sheet?')) {
      setApiUrl('');
      setNeedsSetup(true);
    }
  };

  if (needsSetup) {
    return (
      <SetupScreen setupUrl={setupUrl} setSetupUrl={setSetupUrl} onSave={handleSaveSetup} />
    );
  }

  const appBaseUrl = window.location.href.split('#')[0];
  const guestUrl = `${appBaseUrl}?apiUrl=${encodeURIComponent(getApiUrl() || '')}#/`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(guestUrl)}&bgcolor=ffffff&color=000000&margin=10&format=svg`;

  return (
    <div className="relative w-screen h-screen bg-firma-dark overflow-hidden selection:bg-firma-pink selection:text-white">
      
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-firma-pink/20 rounded-full blur-[120px] animate-blob mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-firma-pink/10 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* Physics Canvas */}
      <div className="absolute inset-0 flex items-center justify-center overflow-visible pointer-events-none">
        <div 
          className="relative w-0 h-0 transition-transform duration-75 ease-linear will-change-transform"
          style={{ transform: `scale(${globalScale})` }}
        >
          {messages.map((msg) => (
            <FloatingMessage 
              key={msg.id} 
              message={msg}
              lineMode={config.lineMode}
              ref={(el) => {
                if (el) elementsRef.current.set(msg.id, el);
                else elementsRef.current.delete(msg.id);
              }}
            />
          ))}
        </div>
      </div>

      {/* Empty State */}
      {messages.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="text-firma-pink/50 text-6xl md:text-8xl font-syne font-black uppercase tracking-tighter text-center leading-none animate-pulse opacity-20 max-w-4xl px-4">
            21st Birthday<br/>Wall
          </div>
          <div className="text-gray-500 text-sm font-grotesk uppercase tracking-[0.5em] mt-8">Waiting for messages</div>
        </div>
      )}

      {/* Brand Header */}
      <div className="absolute top-8 left-8 z-50 pointer-events-none">
         <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Firma" className="h-12 w-auto object-contain" />
            {/* Firma text removed as requested */}
         </div>
      </div>

      {/* QR & Footer */}
      <div className="absolute bottom-8 right-8 z-40 bg-firma-dark/90 backdrop-blur-md border border-gray-800/50 rounded-xl p-6 pointer-events-auto shadow-2xl flex flex-col items-center gap-4">
        <div className="text-center space-y-1">
          <p className="text-xs font-grotesk text-gray-400 uppercase tracking-widest">Join the Party</p>
          <div className="text-white font-bold font-syne text-2xl uppercase">Scan to Send</div>
        </div>
        <div className="bg-white p-3 rounded-lg w-[160px] h-[160px] shrink-0 shadow-inner">
          <img src={qrCodeUrl} alt="Scan to send" className="w-full h-full object-contain mix-blend-multiply" />
        </div>
      </div>

      {/* Controls Toggle */}
      <button 
        onClick={() => setShowControls(!showControls)}
        className="absolute top-8 right-8 z-50 text-gray-500 hover:text-white transition-colors p-2 bg-gray-900/50 rounded-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 18H7.5M3.75 12h18" />
        </svg>
      </button>

      {/* Control Panel Overlay */}
      {showControls && (
        <div className="absolute top-20 right-8 z-50 w-72 bg-gray-900/95 backdrop-blur-xl border border-gray-800 p-6 shadow-2xl rounded-lg animate-fade-in text-xs font-grotesk uppercase tracking-wider">
          <h3 className="text-white font-bold mb-4 border-b border-gray-700 pb-2 flex justify-between">
            <span>Controls</span>
            <span className="text-gray-500">{messages.length} wishes</span>
          </h3>
          
          <div className="space-y-6">
            
            {/* Zoom Controls */}
            <div>
              <div className="flex justify-between text-gray-400 mb-2">
                <span>Zoom</span>
                <span className="text-white">{config.manualZoom ? `${config.manualZoom.toFixed(1)}x` : 'Auto'}</span>
              </div>
              <input 
                type="range" 
                min="0.2" max="2.0" step="0.1"
                value={config.manualZoom || globalScale}
                onChange={(e) => setConfig(prev => ({ ...prev, manualZoom: parseFloat(e.target.value) }))}
                className="w-full accent-firma-pink bg-gray-700 h-1 rounded appearance-none"
              />
              <button 
                onClick={() => setConfig(prev => ({ ...prev, manualZoom: null }))}
                className={`mt-2 w-full py-1 text-[10px] border ${config.manualZoom === null ? 'border-firma-pink text-firma-pink' : 'border-gray-700 text-gray-500'} rounded hover:bg-gray-800`}
              >
                Reset to Auto-Zoom
              </button>
            </div>

            {/* Physics Params */}
            <div>
              <div className="flex justify-between text-gray-400 mb-2">
                <span>Movement Speed</span>
                <span className="text-white">{config.speed.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0" max="1.0" step="0.1"
                value={config.speed}
                onChange={(e) => setConfig(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                className="w-full accent-firma-pink bg-gray-700 h-1 rounded appearance-none"
              />
            </div>

            <div>
              <div className="flex justify-between text-gray-400 mb-2">
                <span>Spread Distance</span>
                <span className="text-white">{config.distance.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0.5" max="2.5" step="0.1"
                value={config.distance}
                onChange={(e) => setConfig(prev => ({ ...prev, distance: parseFloat(e.target.value) }))}
                className="w-full accent-firma-pink bg-gray-700 h-1 rounded appearance-none"
              />
            </div>

            {/* Line Mode */}
            <div>
              <div className="text-gray-400 mb-2">Text Layout</div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setConfig(prev => ({ ...prev, lineMode: 'compact' }))}
                  className={`py-2 border ${config.lineMode === 'compact' ? 'bg-firma-pink border-firma-pink text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                >
                  Compact
                </button>
                <button 
                  onClick={() => setConfig(prev => ({ ...prev, lineMode: 'full' }))}
                  className={`py-2 border ${config.lineMode === 'full' ? 'bg-firma-pink border-firma-pink text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                >
                  Full Line
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-700 space-y-2">
               <button onClick={handleReset} className="w-full py-2 bg-gray-800/50 hover:bg-red-900/50 text-red-400 hover:text-red-200 transition-colors border border-transparent hover:border-red-900/50">
                 Clear Messages
               </button>
               <button onClick={handleDisconnect} className="w-full py-2 text-gray-500 hover:text-white transition-colors text-xs">
                 Disconnect Sheet
               </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

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