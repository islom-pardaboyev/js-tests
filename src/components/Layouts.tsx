import { Link, Outlet } from 'react-router-dom';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useScrollReveal } from '../lib/motion';
import OfflinePage from '../pages/OfflinePage';
import { CodeLoader } from './CodeLoader';
import { SiteHeader } from './SiteHeader';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <p>A JavaScript test with a certificate.</p>
        <nav aria-label="Footer">
          <Link to="/verify">Verify a certificate</Link>
          <Link to="/login">Sign in</Link>
        </nav>
        <p className="footer-end">Portfolio demo. Results are practice, not a proctored credential.</p>
      </div>
    </footer>
  );
}

/** Header + routed page + footer, for every page except the exam itself. */
export function SiteLayout() {
  useScrollReveal();
  const [online, setOnline] = useOnlineStatus();
  return (
    <div className="app-bg stage">
      <SiteHeader />
      {/* Kept mounted while offline so page state survives a dropped connection. */}
      {!online && <main><OfflinePage onRetry={() => setOnline(true)} /></main>}
      <main hidden={!online}>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}

export function FullScreenLoader() {
  return (
    <div className="app-bg stage grid min-h-dvh place-items-center p-6" role="status" aria-live="polite">
      <CodeLoader scope="page" />
    </div>
  );
}
