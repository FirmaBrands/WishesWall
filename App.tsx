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
    </>
  );
};

export default App;
