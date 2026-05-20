import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useUser } from '../context/UserContext';
import ChallengeCard from '../components/ChallengeCard';
import { TagBadge } from '../components/Badges';

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const POPULAR_TAGS = ['Arrays', 'Strings', 'Recursion', 'OOP', 'Math', 'Sorting',
                      'Dynamic Programming', 'Graph', 'File Handling'];

export default function Challenges() {
  const { user } = useUser();

  const [challenges, setChallenges] = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const [search, setSearch]       = useState('');
  const [difficulty, setDiff]     = useState('');
  const [activeTag, setActiveTag] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (search)     params.set('search', search);
      if (difficulty) params.set('difficulty', difficulty);
      if (activeTag)  params.set('tag', activeTag);
      const data = await api.get(`/challenges?${params}`);
      setChallenges(data.challenges || []);
      setTotal(data.total || 0);
    } catch {
      setError('Failed to load challenges. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [search, difficulty, activeTag]);

  useEffect(() => {
    const t = setTimeout(fetch, 300);
    return () => clearTimeout(t);
  }, [fetch]);

  const hasFilters = search || difficulty || activeTag;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">Challenges</h1>
          <p className="text-clash-dim text-sm mt-1">
            {loading ? 'Loading…' : `${total} challenge${total !== 1 ? 's' : ''} available`}
          </p>
        </div>
        {user
          ? <Link to="/challenges/new" className="btn-primary">+ Create Challenge</Link>
          : <Link to="/" className="btn-secondary text-sm">Join to create</Link>}
      </div>

      <div className="space-y-4 mb-8">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clash-dim"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="search" className="input pl-10" placeholder="Search challenges…"
                 value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-clash-dim font-display uppercase tracking-widest mr-1">Difficulty:</span>
          {DIFFICULTIES.map(d => (
            <button key={d} type="button"
                    onClick={() => setDiff(p => p === d ? '' : d)}
                    className={`px-3 py-1 rounded-lg text-xs font-display font-semibold border transition-all
                                ${difficulty === d
                                  ? 'bg-clash-cyan/20 border-clash-cyan/50 text-clash-cyan'
                                  : 'border-clash-border text-clash-dim hover:border-clash-cyan/30'}`}>
              {d}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-clash-dim font-display uppercase tracking-widest mr-1">Tags:</span>
          {POPULAR_TAGS.map(tag => (
            <TagBadge key={tag} tag={tag}
                      selected={activeTag === tag}
                      onClick={() => setActiveTag(p => p === tag ? '' : tag)} />
          ))}
        </div>

        {hasFilters && (
          <button onClick={() => { setSearch(''); setDiff(''); setActiveTag(''); }}
                  className="text-xs text-clash-red hover:underline font-display">
            ✕ Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="card border-clash-red/30 bg-clash-red/5 p-6 text-center text-clash-red text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-48 animate-pulse opacity-50" />)}
        </div>
      ) : challenges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {challenges.map(c => <ChallengeCard key={c.id} challenge={c} />)}
        </div>
      ) : !error && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="font-display font-bold text-lg text-clash-text mb-2">No challenges found</h3>
          <p className="text-clash-dim text-sm mb-6">
            {hasFilters ? 'Try adjusting your filters.' : 'Be the first to create one!'}
          </p>
          {user && <Link to="/challenges/new" className="btn-primary">Create First Challenge</Link>}
        </div>
      )}
    </div>
  );
}