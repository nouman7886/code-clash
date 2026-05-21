import React from 'react';

const LANGUAGES = [
  {
    key: 'cpp',
    label: 'C++',
    src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg',
  },
  {
    key: 'java',
    label: 'Java',
    src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg',
  },
  {
    key: 'python',
    label: 'Python',
    src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg',
  },
  {
    key: 'javascript',
    label: 'JavaScript',
    src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
  },
];

export default function LanguageBadges({ compact = false }) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Supported languages">
      {LANGUAGES.map(language => (
        <span
          key={language.key}
          title={language.label}
          className={`inline-flex items-center gap-1 rounded-md border border-clash-border bg-clash-muted/50
                      text-clash-dim font-display font-semibold
                      ${compact ? 'px-1.5 py-1 text-[10px]' : 'px-2 py-1 text-xs'}`}
        >
          <img
            src={language.src}
            alt=""
            className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}
            loading="lazy"
          />
          {!compact && <span>{language.label}</span>}
        </span>
      ))}
    </div>
  );
}
