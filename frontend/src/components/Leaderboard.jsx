import React from 'react';

const RANK_ICONS  = ['🥇', '🥈', '🥉'];
const LANG_LABELS = {
  python: 'Python', java: 'Java', cpp: 'C++', javascript: 'JavaScript',
};

export default function Leaderboard({ submissions, currentUserId }) {
  if (!submissions?.length) {
    return (
      <div className="text-center py-8 text-clash-dim">
        <p className="text-3xl mb-2">🏆</p>
        <p className="text-sm font-display">No submissions yet</p>
        <p className="text-xs mt-1 opacity-60">Be the first to submit!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {submissions.map((s, i) => {
        const isMe = s.userId === currentUserId;
        return (
          <div key={s.id || s.userId}
               className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border
                           ${isMe
                             ? 'bg-clash-cyan/10 border-clash-cyan/30'
                             : 'bg-clash-muted/30 border-clash-border'}`}>
            <span className="text-lg w-8 text-center shrink-0">
              {i < 3 ? RANK_ICONS[i] : `#${i + 1}`}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`font-display font-semibold text-sm truncate
                                 ${isMe ? 'text-clash-cyan' : 'text-clash-text'}`}>
                  {s.displayName}
                </span>
                {isMe && <span className="text-[10px] font-display font-bold text-clash-cyan/60 uppercase">(you)</span>}
              </div>
              <span className="text-xs text-clash-dim font-mono">
                {LANG_LABELS[s.language] || s.language}
              </span>
            </div>
            <span className="text-xs text-clash-dim font-mono shrink-0">
              {new Date(s.submittedAt).toLocaleTimeString([], {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}