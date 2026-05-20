import React from 'react';

const LANG_LABELS = {
  python: '🐍 Python', java: '☕ Java', cpp: '⚙️ C++', javascript: '🟨 JS',
};

export default function ParticipantList({ participants, currentUserId, onSelectParticipant, selectedUserId }) {
  return (
    <div className="space-y-2">
      {participants.map(p => {
        const isMe       = p.userId === currentUserId;
        const isSelected = p.userId === selectedUserId;

        return (
          <button
            key={p.userId}
            onClick={() => !isMe && onSelectParticipant?.(p.userId)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border
                        transition-all duration-200 text-left
                        ${isMe
                          ? 'bg-clash-cyan/10 border-clash-cyan/30 cursor-default'
                          : isSelected
                          ? 'bg-clash-purple/15 border-clash-purple/40'
                          : 'bg-clash-muted/40 border-clash-border hover:border-clash-cyan/20'}`}
            type="button"
          >
            <span className={p.isTyping ? 'dot-typing' : 'dot-online'} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`font-display font-semibold text-sm truncate
                                 ${isMe ? 'text-clash-cyan' : 'text-clash-text'}`}>
                  {p.displayName}
                </span>
                {isMe && <span className="text-[10px] font-display font-bold text-clash-cyan/60 uppercase">(you)</span>}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-clash-dim font-mono">
                  {LANG_LABELS[p.language] || p.language}
                </span>
                {p.isTyping && <span className="text-xs text-clash-amber animate-pulse">typing…</span>}
              </div>
            </div>
            {!isMe && (
              <span className={`text-xs font-display shrink-0
                               ${isSelected ? 'text-clash-purple' : 'text-clash-dim'}`}>
                {isSelected ? '👁 viewing' : 'view'}
              </span>
            )}
          </button>
        );
      })}
      {participants.length === 0 && (
        <p className="text-center text-clash-dim text-sm py-4">No participants yet</p>
      )}
    </div>
  );
}