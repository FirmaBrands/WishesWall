import React, { useEffect, useState } from 'react';
import GuestView from './components/GuestView';
import DisplayView from './components/DisplayView';
import { ViewMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<ViewMode>(ViewMode.GUEST);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === '/display') {
        setMode(ViewMode.DISPLAY);
      } else {
        setMode(ViewMode.GUEST);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <>
      {mode === ViewMode.GUEST ? <GuestView /> : <DisplayView />}
      
      {/* Navigation Helper */}
      {mode === ViewMode.GUEST && (
        <div className="fixed bottom-6 right-6 z-[9999]">
             <a 
               href="#/display"
               target="_blank"
               rel="noopener noreferrer"
               className="group flex items-center gap-3 bg-white hover:bg-gray-200 text-black px-6 py-4 font-mono text-xs font-bold uppercase tracking-widest shadow-lg transition-all border border-transparent"
             >
            <span>Open Wall</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      )}
    </>
  );
};

export default App;
