import { useState } from 'react';
import { StatusScreen } from '../components/StatusScreen';
import { usePageMeta } from '../lib/seo';

/** Real reachability check: navigator.onLine can say true on a dead network. */
async function canReachSite(): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    await fetch(`/favicon.svg?ping=${Date.now()}`, { cache: 'no-store' });
    return true;
  } catch {
    return false;
  }
}

export default function OfflinePage({ onRetry }: { onRetry: () => void }) {
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);
  usePageMeta({
    title: 'No internet connection',
    description: 'You are offline. Reconnect to keep using JSTests.',
    noindex: true,
  });

  const retry = async () => {
    setChecking(true);
    setFailed(false);
    const ok = await canReachSite();
    setChecking(false);
    if (ok) onRetry();
    else setFailed(true);
  };

  return (
    <StatusScreen
      art="offline"
      role="alert"
      title="No internet connection"
      code="TypeError: Failed to fetch"
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={retry} disabled={checking}>
            {checking ? 'Checking…' : 'Try again'}
          </button>
          {failed && <span className="mono-note" role="status">Still offline.</span>}
        </>
      }
    >
      Check your Wi-Fi or cable, then try again. This page closes on its own when the connection returns.
    </StatusScreen>
  );
}
