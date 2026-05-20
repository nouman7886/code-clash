import React from 'react';

const DIFFICULTY_STYLES = {
  Beginner:     'bg-clash-green/15 text-clash-green border-clash-green/30',
  Intermediate: 'bg-clash-amber/15 text-clash-amber border-clash-amber/30',
  Advanced:     'bg-clash-red/15   text-clash-red   border-clash-red/30',
};

export function DifficultyBadge({ difficulty }) {
  const style = DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.Intermediate;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                      text-xs font-display font-semibold tracking-wider border ${style}`}>
      {'◆'.repeat(
        difficulty === 'Beginner' ? 1 : difficulty === 'Advanced' ? 3 : 2
      )}{' '}
      {difficulty}
    </span>
  );
}

export function TagBadge({ tag, onClick, selected }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs
                  font-mono font-medium tracking-wide border transition-all duration-150
                  ${selected
                    ? 'bg-clash-cyan/20 text-clash-cyan border-clash-cyan/50'
                    : 'bg-clash-muted/60 text-clash-dim border-clash-border hover:border-clash-cyan/30 hover:text-clash-text'}
                  ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {tag}
    </button>
  );
}