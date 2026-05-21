import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useUser } from '../context/UserContext';
import { TagBadge } from '../components/Badges';

const ALL_TAGS = [
  'Arrays', 'Strings', 'Recursion', 'OOP', 'GUI', 'Networking', 'File Handling',
  'Math', 'Sorting', 'Graph', 'Dynamic Programming', 'Tree', 'Stack', 'Queue',
  'Hash Table', 'Binary Search', 'Two Pointers', 'Greedy', 'Bit Manipulation', 'Matrix',
];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function CreateChallenge() {
  const { user } = useUser();
  const navigate  = useNavigate();

  const [title, setTitle]           = useState('');
  const [problem, setProblem]       = useState('');
  const [constraints, setConst]     = useState('');
  const [sampleInput, setSi]        = useState('');
  const [sampleOutput, setSo]       = useState('');
  const [difficulty, setDiff]       = useState('Intermediate');
  const [tags, setTags]             = useState([]);
  const [step, setStep]             = useState('write');   // 'write' | 'analysing' | 'confirm'
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🔒</p>
        <h2 className="section-title mb-3">Join first</h2>
        <p className="text-clash-dim text-sm mb-6">You need a display name to create challenges.</p>
        <Link to="/" className="btn-primary">Enter the Arena</Link>
      </div>
    );
  }

  async function handleAnalyse(e) {
    e.preventDefault();
    if (!title.trim() || !problem.trim()) { setError('Title and problem are required'); return; }
    setError(''); setLoading(true); setStep('analysing');
    try {
      const res = await api.post('/challenges/analyse', { title, problem });
      setDiff(res.difficulty || 'Intermediate');
      setTags(res.tags || []);
      setStep('confirm');
    } catch {
      setError('AI analysis failed - set difficulty and tags manually.');
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const c = await api.post('/challenges', {
        title: title.trim(), problem: problem.trim(),
        constraints: constraints.trim(), sampleInput: sampleInput.trim(),
        sampleOutput: sampleOutput.trim(), difficulty, tags, creatorId: user.id,
      });
      navigate(`/challenges/${c.id}`);
    } catch (err) {
      setError(err.message || 'Failed to save');
      setLoading(false);
    }
  }

  const toggleTag = tag => setTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/challenges"
            className="text-clash-dim text-sm hover:text-clash-cyan flex items-center gap-1 mb-6 transition-colors">
        ← Back
      </Link>
      <h1 className="section-title mb-1">Create a Challenge</h1>
      <p className="text-clash-dim text-sm mb-8">Write your problem - AI suggests difficulty and tags.</p>

      {step === 'analysing' ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="text-5xl mb-4 animate-pulse">🤖</div>
          <h3 className="font-display font-bold text-clash-cyan text-lg mb-2">Analysing your challenge…</h3>
          <p className="text-clash-dim text-sm">AI is reading your problem statement</p>
          <div className="flex justify-center gap-1 mt-8">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-clash-cyan animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={step === 'write' ? handleAnalyse : handleSave}>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-display font-semibold text-clash-text mb-1.5">
                Title <span className="text-clash-red">*</span>
              </label>
              <input className="input" placeholder="e.g. Two Sum, Fibonacci…"
                     value={title} onChange={e => setTitle(e.target.value)}
                     maxLength={100} disabled={step === 'confirm'} />
            </div>

            <div>
              <label className="block text-sm font-display font-semibold text-clash-text mb-1.5">
                Problem Statement <span className="text-clash-red">*</span>
              </label>
              <textarea className="textarea" rows={8}
                        placeholder="Describe the problem, expected behaviour, and edge cases…"
                        value={problem} onChange={e => setProblem(e.target.value)}
                        disabled={step === 'confirm'} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-display font-semibold text-clash-text mb-1.5">
                  Constraints <span className="text-clash-dim font-normal">(optional)</span>
                </label>
                <textarea className="textarea" rows={3} placeholder="1 ≤ n ≤ 10⁵"
                          value={constraints} onChange={e => setConst(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-display font-semibold text-clash-text mb-1.5">
                  Sample Input <span className="text-clash-dim font-normal">(optional)</span>
                </label>
                <textarea className="textarea font-mono text-xs" rows={3}
                          value={sampleInput} onChange={e => setSi(e.target.value)} />
              </div>
            </div>

            {sampleInput && (
              <div>
                <label className="block text-sm font-display font-semibold text-clash-text mb-1.5">
                  Sample Output
                </label>
                <textarea className="textarea font-mono text-xs" rows={2}
                          value={sampleOutput} onChange={e => setSo(e.target.value)} />
              </div>
            )}

            {/* AI Confirm panel */}
            {step === 'confirm' && (
              <div className="card border-clash-cyan/20 p-5 space-y-5 animate-slide-up">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <h3 className="font-display font-bold text-clash-cyan text-sm tracking-wider">
                    AI Analysis Complete — Edit before saving
                  </h3>
                </div>

                <div>
                  <p className="text-xs font-display font-semibold text-clash-dim uppercase tracking-widest mb-2">
                    Difficulty
                  </p>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map(d => (
                      <button key={d} type="button" onClick={() => setDiff(d)}
                              className={`px-4 py-1.5 rounded-lg text-sm font-display font-semibold border
                                          transition-all duration-150
                                          ${difficulty === d
                                            ? 'bg-clash-cyan/20 border-clash-cyan/50 text-clash-cyan'
                                            : 'border-clash-border text-clash-dim hover:border-clash-cyan/30'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-display font-semibold text-clash-dim uppercase tracking-widest mb-2">
                    Tags (click to toggle)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_TAGS.map(t => (
                      <TagBadge key={t} tag={t} selected={tags.includes(t)} onClick={() => toggleTag(t)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-clash-red text-sm bg-clash-red/10 border border-clash-red/30
                             rounded-lg px-4 py-2 animate-fade-in">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              {step === 'write' ? (
                <button type="submit" className="btn-primary" disabled={loading}>
                  Analyze with AI
                </button>
              ) : (
                <>
                  <button type="button" className="btn-secondary" disabled={loading}
                          onClick={() => setStep('write')}>
                    ← Edit Problem
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving…' : '✓ Save Challenge'}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
