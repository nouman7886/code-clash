import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../utils/api';

const TOKEN_KEY = 'cc_admin_token';

function statusClass(status) {
  if (status === 'active') return 'text-clash-green border-clash-green/30 bg-clash-green/10';
  if (status === 'ended') return 'text-clash-red border-clash-red/30 bg-clash-red/10';
  return 'text-clash-amber border-clash-amber/30 bg-clash-amber/10';
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [username, setUsername] = useState('Mani6778');
  const [password, setPassword] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function adminFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  async function loadRooms() {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const data = await adminFetch('/admin/rooms');
      setRooms(data.rooms || []);
    } catch (err) {
      setError(err.message || 'Failed to load rooms');
      if (err.message === 'Admin login required') {
        localStorage.removeItem(TOKEN_KEY);
        setToken('');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRooms();
  }, [token]);

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setPassword('');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function deleteRoom(roomId) {
    if (!confirm('Delete this room?')) return;

    setLoading(true);
    setError('');

    try {
      await adminFetch(`/admin/rooms/${roomId}`, { method: 'DELETE' });
      setRooms(prev => prev.filter(room => room.id !== roomId));
    } catch (err) {
      setError(err.message || 'Failed to delete room');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setRooms([]);
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="rounded-xl border border-clash-border bg-clash-surface p-6 shadow-[0_0_40px_rgba(0,229,255,0.06)]">
          <div className="mb-6">
            <p className="text-xs text-clash-cyan font-display font-semibold uppercase tracking-widest">Admin</p>
            <h1 className="font-display font-bold text-2xl text-clash-text mt-2">Room Control</h1>
          </div>

          <form onSubmit={login} className="space-y-4">
            <input
              className="input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Admin username"
              autoComplete="username"
            />
            <input
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin password"
              type="password"
              autoComplete="current-password"
            />

            {error && <p className="text-clash-red text-sm">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Checking...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs text-clash-cyan font-display font-semibold uppercase tracking-widest">Admin</p>
          <h1 className="font-display font-bold text-3xl text-clash-text mt-2">Room Control</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadRooms} disabled={loading} className="btn-secondary text-xs py-2 px-4">
            Refresh
          </button>
          <button onClick={logout} className="btn-secondary text-xs py-2 px-4">
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-clash-red/30 bg-clash-red/10 px-4 py-3 text-clash-red text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {rooms.map(room => (
          <article key={room.id} className="rounded-xl border border-clash-border bg-clash-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display font-bold text-base text-clash-text truncate">
                  {room.challenge?.title || 'Untitled challenge'}
                </h2>
                <p className="text-xs text-clash-dim font-mono mt-1 truncate">{room.id}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-display font-semibold capitalize ${statusClass(room.status)}`}>
                {room.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="rounded-lg border border-clash-border bg-clash-muted/30 p-3">
                <div className="text-xs text-clash-dim font-display uppercase tracking-widest">Players</div>
                <div className="text-xl font-display font-bold text-clash-cyan mt-1">{room.participants.length}</div>
              </div>
              <div className="rounded-lg border border-clash-border bg-clash-muted/30 p-3">
                <div className="text-xs text-clash-dim font-display uppercase tracking-widest">Subs</div>
                <div className="text-xl font-display font-bold text-clash-green mt-1">{room.submissionCount}</div>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs text-clash-dim font-display uppercase tracking-widest mb-2">Participants</div>
              <div className="flex flex-wrap gap-2">
                {room.participants.length ? room.participants.map(player => (
                  <span key={player.userId} className="rounded-full border border-clash-border bg-clash-muted/40 px-2.5 py-1 text-xs text-clash-text">
                    {player.displayName}
                  </span>
                )) : (
                  <span className="text-xs text-clash-dim">No players</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-clash-border">
              <Link to={`/room/${room.id}`} className="btn-secondary text-xs py-2 px-4">
                Open
              </Link>
              <button
                onClick={() => deleteRoom(room.id)}
                disabled={loading}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-clash-red/40 bg-clash-red/10 text-clash-red text-xs font-display font-semibold transition-colors hover:bg-clash-red/15 disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {!loading && rooms.length === 0 && (
        <div className="rounded-xl border border-clash-border bg-clash-surface p-10 text-center">
          <p className="text-clash-dim font-display">No rooms found</p>
        </div>
      )}
    </div>
  );
}
