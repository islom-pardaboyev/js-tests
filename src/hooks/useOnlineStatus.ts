import { useEffect, useState } from 'react';

/** Tracks the browser's online/offline events. `setOnline` lets a retry override a stale offline flag. */
export function useOnlineStatus(): [boolean, (online: boolean) => void] {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return [online, setOnline];
}
