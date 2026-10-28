import { useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { gsap, useGsap, useScrollFx } from '../lib/motion';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

const linkClass = 'nav-link';

export function SiteHeader() {
  const { user, isAdmin, loading } = useAuth();
  const root = useRef<HTMLElement>(null);
  useScrollFx();

  // One authored moment: the seal turns into place on first paint of the session.
  useGsap(root, () => {
    if (sessionStorage.getItem('jstests-intro')) return;
    gsap.from('.logo-mark', { rotate: -120, scale: 0.6, opacity: 0, duration: 1.1, ease: 'expo.out' });
    sessionStorage.setItem('jstests-intro', '1');
  }, []);

  return (
    <header className="header" ref={root}>
      <div className="scroll-bar" aria-hidden="true" />
      <div className="container header-inner">
        <Logo />
        <nav className="header-nav" aria-label="Main">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          {user && <NavLink to="/dashboard" className={linkClass}>Tests</NavLink>}
          <NavLink to="/verify" className={linkClass}>Verify certificate</NavLink>
          {isAdmin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
        </nav>
        <div className="header-end">
          <ThemeToggle />
          {!loading && (user ? <UserMenu /> : <Link to="/login" className="btn btn-primary btn-sm">Sign in</Link>)}
        </div>
      </div>
    </header>
  );
}
