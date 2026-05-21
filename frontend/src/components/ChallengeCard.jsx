import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DifficultyBadge, TagBadge } from './Badges';
import LanguageBadges from './LanguageBadges';

export default function ChallengeCard({ challenge }) {
  const navigate = useNavigate();
  const { id, title, problem, difficulty, tags, creator, createdAt, rooms } = challenge;
  const preview    = problem.length > 120 ? problem.slice(0, 120) + '…' : problem;
  const activeRooms = rooms?.filter(r => r.status !== 'ended').length || 0;

  return (
    <article
      className="card-hover p-5 animate-fade-in group"
      onClick={() => navigate(`/challenges/${id}`)}
      role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/challenges/${id}`)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-display font-bold text-base text-clash-text
                       group-hover:text-clash-cyan transition-colors leading-tight line-clamp-2">
          {title}
        </h3>
        <DifficultyBadge difficulty={difficulty} />
      </div>

      <p className="text-sm text-clash-dim leading-relaxed mb-4 line-clamp-3">{preview}</p>

      <div className="mb-4">
        <LanguageBadges compact />
      </div>

      {tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0, 4).map(t => <TagBadge key={t} tag={t} />)}
          {tags.length > 4 && <span className="text-xs text-clash-dim">+{tags.length - 4}</span>}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-clash-dim
                      pt-3 border-t border-clash-border/60">
        <span className="flex items-center gap-1">
          <span className="text-clash-purple">@</span>
          {creator?.displayName}
          <span className="mx-1 opacity-40">·</span>
          {timeAgo(createdAt)}
        </span>
        {activeRooms > 0 && (
          <span className="flex items-center gap-1.5 text-clash-green font-medium">
            <span className="dot-online" />
            {activeRooms} live
          </span>
        )}
      </div>
    </article>
  );
}

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'just now';
}
