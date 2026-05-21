import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useUser } from '../context/UserContext';
import { DifficultyBadge, TagBadge } from '../components/Badges';

export default function ChallengeDetail() {
  const { id }   = useParams();
  const { user } = useUser();
  const navigate  = useNavigate();

  const [challenge, setChallenge]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [actionLoading, setAction]  = useState('');

  const load = useCallback(async () => {
    try {
      setChallenge(await api.get(`/challenges/${id}`));
    } catch {
      setError('Challenge not found.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function createRoom() {
    if (!user) { navigate('/'); return; }
    setAction('create');
    try {
      const room = await api.post('/rooms', { challengeId: id, creatorId: user.id });
      navigate(`/room/${room.id}`);
    } catch (err) { setError(err.message); setAction(''); }
  }

  async function joinRoom(roomId) {
    if (!user) { navigate('/'); return; }
    setAction(roomId);
    try {
      await api.post(`/rooms/${roomId}/join`, { userId: user.id });
      navigate(`/room/${roomId}`);
    } catch (err) { setError(err.message); setAction(''); }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <div className="flex justify-center gap-1">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-2 h-2 rounded-full bg-clash-cyan animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );

  if (error || !challenge) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-4">😕</p>
      <h2 className="section-title mb-2">Challenge not found</h2>
      <Link to="/challenges" className="btn-secondary mt-4 inline-flex">← Back</Link>
    </div>
  );

  const openRooms = challenge.rooms?.filter(r => r.status !== 'ended') || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/challenges"
            className="text-clash-dim text-sm hover:text-clash-cyan flex items-center gap-1 mb-6 transition-colors">
        ← All challenges
      </Link>

      {/* Challenge card */}
      <div className="card p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
          <div className="flex-1">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-clash-text leading-tight mb-3">
              {challenge.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <DifficultyBadge difficulty={challenge.difficulty} />
              <span className="text-xs text-clash-dim">
                by <span className="text-clash-purple">{challenge.creator?.displayName}</span>
              </span>
              <span className="text-xs text-clash-dim">
                {new Date(challenge.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {challenge.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {challenge.tags.map(t => <TagBadge key={t} tag={t} />)}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xs font-display font-bold text-clash-dim uppercase tracking-widest mb-3">
            Problem Statement
          </h2>
          <div className="bg-clash-muted/50 rounded-lg p-4 text-clash-text text-sm
                          leading-relaxed whitespace-pre-wrap border border-clash-border/50">
            {challenge.problem}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {challenge.constraints && (
            <div className="sm:col-span-2">
              <h2 className="text-xs font-display font-bold text-clash-dim uppercase tracking-widest mb-2">
                Constraints
              </h2>
              <pre className="bg-clash-muted/50 rounded-lg p-3 text-clash-text text-sm
                              font-mono border border-clash-border/50 whitespace-pre-wrap">
                {challenge.constraints}
              </pre>
            </div>
          )}
          {challenge.sampleInput && (
            <div>
              <h2 className="text-xs font-display font-bold text-clash-dim uppercase tracking-widest mb-2">
                Sample Input
              </h2>
              <pre className="bg-clash-muted/50 rounded-lg p-3 text-clash-text text-xs
                              font-mono border border-clash-border/50 overflow-auto">
                {challenge.sampleInput}
              </pre>
            </div>
          )}
          {challenge.sampleOutput && (
            <div>
              <h2 className="text-xs font-display font-bold text-clash-dim uppercase tracking-widest mb-2">
                Sample Output
              </h2>
              <pre className="bg-clash-muted/50 rounded-lg p-3 text-clash-text text-xs
                              font-mono border border-clash-border/50 overflow-auto">
                {challenge.sampleOutput}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Rooms */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-clash-text">Competition Rooms</h2>
          {user && (
            <button onClick={createRoom} disabled={!!actionLoading} className="btn-primary text-sm">
              {actionLoading === 'create' ? 'Creating…' : '+ New Room'}
            </button>
          )}
        </div>

        {error && (
          <p className="text-clash-red text-sm mb-4 bg-clash-red/10 border border-clash-red/30
                         rounded-lg px-3 py-2">{error}</p>
        )}

        {openRooms.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-3">🚪</p>
            <p className="text-clash-dim text-sm mb-4">No open rooms yet.</p>
            {user
              ? <button onClick={createRoom} className="btn-primary">Create a Room</button>
              : <Link to="/" className="btn-secondary">Join to compete</Link>}
          </div>
        ) : (
          <div className="space-y-3">
            {openRooms.map(room => {
              const isFull   = room.participants.length >= 4;
              const isActive = room.status === 'active';
              return (
                <div key={room.id}
                     className="flex items-center justify-between p-4 rounded-lg
                                border border-clash-border bg-clash-muted/30">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-display font-bold
                                       px-2 py-0.5 rounded-full border
                                       ${isActive
                                         ? 'text-clash-green border-clash-green/40 bg-clash-green/10'
                                         : 'text-clash-amber border-clash-amber/40 bg-clash-amber/10'}`}>
                        {isActive ? '🟢 Active' : '⏳ Waiting'}
                      </span>
                      <span className="text-xs text-clash-dim font-mono">
                        {room.participants.length}/4 players
                      </span>
                      <span className="text-xs text-clash-cyan font-mono">
                        ID {room.code || room.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {room.participants.map(p => (
                        <span key={p.userId}
                              className="text-xs bg-clash-muted px-2 py-0.5 rounded-md
                                         text-clash-text font-mono border border-clash-border">
                          {p.user.displayName}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    {user
                      ? isFull
                        ? <span className="text-xs text-clash-dim">Full</span>
                        : <button onClick={() => joinRoom(room.id)} disabled={!!actionLoading}
                                  className="btn-primary text-xs py-2 px-4">
                            {actionLoading === room.id ? 'Joining…' : 'Join →'}
                          </button>
                      : <Link to="/" className="btn-secondary text-xs py-2 px-4">Sign in to join</Link>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
