import React, { useState, useEffect } from 'react';

export default function Timer({ startedAt, status }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== 'active' || !startedAt) return;
    const start  = new Date(startedAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt, status]);

  const h   = Math.floor(elapsed / 3600);
  const m   = Math.floor((elapsed % 3600) / 60);
  const s   = elapsed % 60;
  const pad = n => String(n).padStart(2, '0');

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border
                     font-mono text-lg font-semibold tracking-widest
                     ${status === 'active'
                       ? 'bg-clash-cyan/10 border-clash-cyan/30 text-clash-cyan'
                       : status === 'ended'
                       ? 'bg-clash-red/10 border-clash-red/30 text-clash-red'
                       : 'bg-clash-muted border-clash-border text-clash-dim'}`}>
      <span className="text-xs font-display opacity-70">
        {status === 'active' ? '⏱' : status === 'ended' ? '🏁' : '⌛'}
      </span>
      {status === 'waiting'
        ? <span className="text-sm">Waiting…</span>
        : <span>{h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)}</span>
      }
    </div>
  );
}