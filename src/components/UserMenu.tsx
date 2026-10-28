import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ChevronIcon, ShieldIcon } from './Icons';

export function UserMenu() {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;
  const name = user.displayName ?? user.email ?? 'Account';
  const close = () => setOpen(false);

  return (
    <div className="relative" ref={root}>
      <button type="button" className="user-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
        <span className="hidden max-w-[120px] truncate sm:inline">{name.split(' ')[0]}</span>
        <ChevronIcon />
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="who">
            <p className="font-semibold">{name}</p>
            <p className="muted truncate text-[0.8125rem]">{user.email}</p>
          </div>
          <hr />
          <Link to="/dashboard" role="menuitem" onClick={close}>My tests</Link>
          <Link to="/verify" role="menuitem" className="mobile-only" onClick={close}>Verify a certificate</Link>
          {isAdmin && <Link to="/admin" role="menuitem" onClick={close}><ShieldIcon /> Admin panel</Link>}
          <hr />
          <button type="button" role="menuitem" onClick={() => void signOut()}>Sign out</button>
        </div>
      )}
    </div>
  );
}
