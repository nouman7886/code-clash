import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function Navbar() {
  const { user, logout } = useUser();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [open, setOpen]  = useState(false);

  const nav = [
    { to: '/challenges',     label: 'Browse' },
    { to: '/challenges/new', label: 'Create' },
    { to: '/admin',          label: 'Admin' },
  ];
  const active = (path) => location.pathname.startsWith(path);

  return (
    <nav className="sticky top-0 z-50 border-b border-clash-border bg-clash-bg/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl">⚡</span>
            <span className="font-display font-bold text-xl tracking-widest
                             group-hover:text-clash-cyan transition-colors">
              CODE<span className="text-clash-cyan text-glow-cyan"> CLASH</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-1">
            {nav.map(({ to, label }) => (
              <Link key={to} to={to}
                    className={`px-4 py-2 rounded-lg font-display font-medium text-sm
                                tracking-wide transition-all duration-200
                                ${active(to)
                                  ? 'text-clash-cyan bg-clash-cyan/10'
                                  : 'text-clash-dim hover:text-clash-text hover:bg-clash-muted'}`}>
                {label}
              </Link>
            ))}
          </div>

          {/* User chip */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                                bg-clash-muted border border-clash-border">
                  <span className="dot-online" />
                  <span className="font-display text-sm text-clash-cyan font-semibold tracking-wide">
                    {user.displayName}
                  </span>
                </div>
                <button onClick={() => { logout(); navigate('/'); }}
                        className="text-xs text-clash-dim hover:text-clash-red transition-colors px-2">
                  Exit
                </button>
              </>
            ) : (
              <Link to="/" className="btn-primary text-xs py-2 px-4">
                Join the Clash
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="sm:hidden p-2 text-clash-dim hover:text-clash-text"
                  onClick={() => setOpen(o => !o)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="sm:hidden pb-4 border-t border-clash-border mt-2 pt-4 animate-fade-in">
            {nav.map(({ to, label }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                    className="block px-4 py-2 font-display text-sm text-clash-dim
                               hover:text-clash-cyan rounded-lg transition-colors">
                {label}
              </Link>
            ))}
            {user && (
              <div className="mt-3 px-4 pt-3 border-t border-clash-border flex items-center justify-between">
                <span className="font-display text-sm text-clash-cyan">{user.displayName}</span>
                <button onClick={() => { logout(); navigate('/'); setOpen(false); }}
                        className="text-xs text-clash-red">Exit</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
