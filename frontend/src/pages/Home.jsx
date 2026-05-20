import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { api } from '../utils/api';
import { DifficultyBadge } from '../components/Badges';

const FEATURES = [
  { icon: '⚡', title: 'Real-time Sync',       desc: 'See every participant\'s code, cursor, and typing activity live.' },
  { icon: '🤖', title: 'AI Analysis',          desc: 'Gemini auto-assigns difficulty and tags to every challenge.' },
  { icon: '🏆', title: 'Instant Leaderboard', desc: 'Ranked by submission time. First to solve it wins.' },
  { icon: '🛠️', title: 'Multi-language',       desc: 'Compete in Python, Java, C++, or JavaScript with Monaco.' },
];

export default function Home() {
  const { user, login } = useUser();
  const navigate        = useNavigate();

  const [name, setName]           = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [recent, setRecent]       = useState([]);

  useEffect(() => {
    api.get('/challenges?limit=3').then(d => setRecent(d.challenges || [])).catch(() => {});
  }, []);

  async function handleJoin(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n || n.length < 2 || n.length > 24) {
      setError('Name must be 2–24 characters'); return;
    }
    setLoading(true); setError('');
    try { await login(n); navigate('/challenges'); }
    catch { setError('Failed to join. Is the backend running?'); }
    finally { setLoading(false); }
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0"
           style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,229,255,0.12) 0%, transparent 70%)' }} />

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border
                        border-clash-cyan/30 bg-clash-cyan/10 text-clash-cyan
                        text-xs font-display font-semibold tracking-widest uppercase mb-8 animate-fade-in">
          <span className="dot-online" /> Free · No Registration · Real-time
        </div>

        <h1 className="font-display font-bold text-5xl sm:text-7xl leading-tight tracking-tight mb-6 animate-slide-up">
          Code. Compete.<br />
          <span className="text-clash-cyan text-glow-cyan">Clash.</span>
        </h1>

        <p className="text-clash-dim text-lg max-w-2xl mx-auto mb-12 leading-relaxed animate-slide-up"
           style={{ animationDelay: '0.1s' }}>
          A free real-time coding competition platform. Create challenges, invite friends,
          and watch each other code — live.
        </p>

        {!user ? (
          <form onSubmit={handleJoin}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto animate-slide-up"
                style={{ animationDelay: '0.15s' }}>
            <input className="input flex-1 text-center sm:text-left text-base py-3"
                   placeholder="Pick a display name…"
                   value={name} onChange={e => { setName(e.target.value); setError(''); }}
                   maxLength={24} autoFocus />
            <button type="submit" disabled={loading} className="btn-primary text-base py-3 px-8 whitespace-nowrap">
              {loading ? 'Joining…' : 'Enter the Arena ⚡'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <p className="text-clash-dim text-sm">
              Welcome back, <span className="text-clash-cyan font-display font-bold">{user.displayName}</span>!
            </p>
            <Link to="/challenges" className="btn-primary">Browse Challenges →</Link>
            <Link to="/challenges/new" className="btn-secondary">Create Challenge</Link>
          </div>
        )}

        {error && <p className="text-clash-red text-sm mt-3">{error}</p>}

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-16 animate-fade-in"
             style={{ animationDelay: '0.25s' }}>
          {[['4', 'Languages'], ['4', 'Max Players'], ['✓', 'AI Analysis'], ['Free', 'Cost']].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="font-display font-bold text-2xl text-clash-cyan">{v}</div>
              <div className="text-xs text-clash-dim uppercase tracking-widest mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="section-title text-center mb-12">
          Everything you need to <span className="text-clash-cyan">clash</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="card p-6 animate-slide-up hover:border-clash-cyan/20"
                 style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
              <span className="text-4xl">{f.icon}</span>
              <h3 className="font-display font-bold text-base text-clash-text mt-4 mb-2">{f.title}</h3>
              <p className="text-clash-dim text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent challenges */}
      {recent.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-clash-border">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title">Recent Challenges</h2>
            <Link to="/challenges" className="text-clash-cyan text-sm font-display hover:text-glow-cyan">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recent.map(c => (
              <Link key={c.id} to={`/challenges/${c.id}`} className="card-hover p-5 group block">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display font-bold text-sm text-clash-text
                                 group-hover:text-clash-cyan transition-colors line-clamp-2">
                    {c.title}
                  </h3>
                  <DifficultyBadge difficulty={c.difficulty} />
                </div>
                <p className="text-xs text-clash-dim line-clamp-2 leading-relaxed">{c.problem}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="section-title mb-12">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { n: '01', t: 'Pick a name',      d: 'No sign-up. Just type a display name and you\'re in.' },
            { n: '02', t: 'Create or join',   d: 'Browse challenges or create your own. Gemini AI analyses it instantly.' },
            { n: '03', t: 'Compete live',     d: 'Enter a room, write code, see everyone else\'s editor in real time.' },
          ].map(({ n, t, d }) => (
            <div key={n}>
              <span className="block font-display font-bold text-6xl text-clash-cyan/15 leading-none mb-3">{n}</span>
              <h3 className="font-display font-bold text-base text-clash-text mb-2">{t}</h3>
              <p className="text-clash-dim text-sm leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}