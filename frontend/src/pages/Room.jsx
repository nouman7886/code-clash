import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { socket } from '../utils/socket';
import { api } from '../utils/api';
import { useUser } from '../context/UserContext';
import CodeEditor from '../components/CodeEditor';
import ParticipantList from '../components/ParticipantList';
import Leaderboard from '../components/Leaderboard';
import Timer from '../components/Timer';
import { DifficultyBadge, TagBadge } from '../components/Badges';

const LANGUAGES = [
  { value: 'python',     label: '🐍 Python' },
  { value: 'java',       label: '☕ Java' },
  { value: 'cpp',        label: '⚙️ C++' },
  { value: 'javascript', label: '🟨 JS' },
];

const STARTER = {
  python: `# Write your solution here
def solution():
    pass

if __name__ == "__main__":
    solution()
`,
  java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
    }
}
`,
  cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}
`,
  javascript: `// Write your solution here
const lines = [];
process.stdin.on('line', l => lines.push(l));
process.stdin.on('close', () => {
    // process lines
});
`,
};

export default function Room() {

  const { roomId } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [myCode, setMyCode] = useState(STARTER.python);
  const [myLang, setMyLang] = useState('python');

  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);

  const [selectedUser, setSelected] = useState(null);
  const [activePanel, setPanel] = useState('challenge');
  const [hasSubmitted, setSubmitted] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState('');

  const typingTimeout = useRef(null);
  const isTyping = useRef(false);

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {

    if (!user) return;

    let alive = true;

    (async () => {

      try {

        await api.post(`/rooms/${roomId}/join`, {
          userId: user.id
        });

        const subs = await api.get(`/submissions/room/${roomId}`);

        if (alive) {

          setSubmissions(subs);

          setSubmitted(
            subs.some(s => s.userId === user.id)
          );

        }

      } catch (err) {

        if (alive) {
          setError(err.message || 'Failed to join room');
        }

      } finally {

        if (alive) setLoading(false);

      }

    })();

    return () => {
      alive = false;
    };

  }, [roomId, user]);

  useEffect(() => {

    api.get(`/rooms/${roomId}`)
      .then(r => setRoom(r))
      .catch(() => {});

  }, [roomId]);

  useEffect(() => {

    if (!user) return;

    socket.connect();

    socket.emit('join-room', {
      roomId,
      userId: user.id,
      displayName: user.displayName
    });

    socket.on('room-state', state => {

      setParticipants(state.participants || []);
      setSubmissions(state.submissions || []);

      const me = state.participants.find(
        p => p.userId === user.id
      );

      if (me) {

        setMyCode(me.code || STARTER[me.language]);

        setMyLang(me.language || 'python');

      }

      if (state.status) {

        setRoom(p => ({
          ...p,
          status: state.status,
          startedAt: state.startedAt
        }));

      }

    });

    socket.on('user-joined', ({
      userId,
      displayName,
      code,
      language
    }) =>
      setParticipants(p =>
        p.find(x => x.userId === userId)
          ? p
          : [
              ...p,
              {
                userId,
                displayName,
                code: code || STARTER[language] || '',
                language: language || 'python',
                cursor: null,
                isTyping: false
              }
            ]
      )
    );

    socket.on('user-left', ({ userId }) => {

      setParticipants(
        p => p.filter(x => x.userId !== userId)
      );

      setSelected(
        s => s === userId ? null : s
      );

    });

    socket.on('code-update', ({ userId, code }) =>
      setParticipants(
        p => p.map(
          x => x.userId === userId
            ? { ...x, code }
            : x
        )
      )
    );

    socket.on('cursor-update', ({ userId, cursor }) =>
      setParticipants(
        p => p.map(
          x => x.userId === userId
            ? { ...x, cursor }
            : x
        )
      )
    );

    socket.on('typing-update', ({ userId, isTyping }) =>
      setParticipants(
        p => p.map(
          x => x.userId === userId
            ? { ...x, isTyping }
            : x
        )
      )
    );

    socket.on('language-update', ({ userId, language, code }) =>
      setParticipants(
        p => p.map(
          x => x.userId === userId
            ? { ...x, language, code }
            : x
        )
      )
    );

    socket.on('new-submission', ({ submission }) =>
      setSubmissions(
        p => p.some(s => s.userId === submission.userId)
          ? p
          : [...p, { ...submission, rank: p.length + 1 }]
      )
    );

    socket.on('room-started', ({ startedAt }) =>
      setRoom(p => ({
        ...p,
        status: 'active',
        startedAt
      }))
    );

    socket.on('room-ended', ({ endedAt }) =>
      setRoom(p => ({
        ...p,
        status: 'ended',
        endedAt
      }))
    );

    socket.on('room-deleted', () => {
      alert('This room was deleted by the admin.');
      navigate('/challenges');
    });

    socket.on('error', ({ message }) =>
      setError(message)
    );

    return () => {

      [
        'room-state',
        'user-joined',
        'user-left',
        'code-update',
        'cursor-update',
        'typing-update',
        'language-update',
        'new-submission',
        'room-started',
        'room-ended',
        'room-deleted',
        'error'
      ].forEach(e => socket.off(e));

      socket.disconnect();

    };

  }, [roomId, user, navigate]);

  const handleCodeChange = useCallback(code => {

    setMyCode(code);

    socket.emit('code-change', {
      roomId,
      userId: user.id,
      code
    });

    if (!isTyping.current) {

      isTyping.current = true;

      socket.emit('typing-status', {
        roomId,
        userId: user.id,
        isTyping: true
      });

    }

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {

      isTyping.current = false;

      socket.emit('typing-status', {
        roomId,
        userId: user.id,
        isTyping: false
      });

    }, 1500);

  }, [roomId, user]);

  const handleCursor = useCallback(cursor =>
    socket.emit('cursor-change', {
      roomId,
      userId: user.id,
      cursor
    }), [roomId, user]);

  function changeLang(lang) {

    setMyLang(lang);

    setMyCode(STARTER[lang] || '');

    socket.emit('language-change', {
      roomId,
      userId: user.id,
      language: lang
    });

  }

  async function runCode() {

    setRunning(true);

    setOutput('Running...');

    try {

      const data = await api.post('/execute', {
        code: myCode,
        language: myLang,
        input: ''
      });

      if (data.stdout) {

        setOutput(data.stdout);

      }
      else if (data.stderr) {

        setOutput(data.stderr);

      }
      else if (data.compile_output) {

        setOutput(data.compile_output);

      }
      else {

        setOutput('No output');

      }

    } catch (err) {

      console.log(err);

      setOutput('Execution failed');

    }

    setRunning(false);

  }

  async function shareRoom() {

    const link = window.location.href;

    try {

      await navigator.clipboard.writeText(link);

      alert('Room link copied!');

    } catch {

      prompt('Copy this link:', link);

    }

  }

  async function startRoom() {

    try {

      await api.post(`/rooms/${roomId}/start`);

    } catch (err) {

      setError(err.message);

    }

  }

  async function submitCode() {

    if (hasSubmitted || subLoading || !myCode.trim()) {

      if (!myCode.trim()) {
        setSubError('Write some code first!');
      }

      return;

    }

    setSubLoading(true);

    setSubError('');

    try {

      await api.post('/submissions', {
        roomId,
        userId: user.id,
        code: myCode,
        language: myLang
      });

      setSubmitted(true);

    } catch (err) {

      setSubError(err.message || 'Failed to submit');

    } finally {

      setSubLoading(false);

    }

  }

  const viewing = participants.find(
    p => p.userId === selectedUser
  );

  const others = participants.filter(
    p => p.userId !== user?.id
  );

  const isCreator =
    room?.challenge?.creatorId === user?.id;

  const roomStatus =
    room?.status || 'waiting';

  const participantCount = participants.length;

  if (loading) {
    return <div className="p-10 text-white">Loading...</div>;
  }

  const challenge = room?.challenge;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">

      <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-clash-border bg-clash-surface/80 backdrop-blur">

        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">

          <span className="font-display font-bold text-sm text-clash-text truncate">
            {challenge?.title || 'Loading…'}
          </span>

          {challenge?.difficulty && (
            <DifficultyBadge difficulty={challenge.difficulty} />
          )}

        </div>

        <Timer startedAt={room?.startedAt} status={roomStatus} />

        <button
          onClick={shareRoom}
          className="btn-secondary text-xs py-2 px-4"
        >
          🔗 Share
        </button>

        <button
          onClick={runCode}
          disabled={running}
          className="btn-primary text-xs py-2 px-4"
        >
          {running ? 'Running...' : '▶ Run'}
        </button>

        {roomStatus === 'active' && (
          <button
            onClick={submitCode}
            disabled={hasSubmitted || subLoading}
            className={`text-xs py-2 px-4 font-display font-bold tracking-wide rounded-lg border transition-all duration-200
            ${hasSubmitted
              ? 'border-clash-green/30 bg-clash-green/10 text-clash-green cursor-default'
              : 'btn-primary animate-glow'}`}
          >
            {hasSubmitted
              ? '✓ Submitted!'
              : subLoading
                ? 'Submitting…'
                : '🚀 Submit'}
          </button>
        )}

      </div>

      {(error || subError) && (
        <div className="shrink-0 px-4 py-2 border-b border-clash-red/30 bg-clash-red/10 text-clash-red text-sm">
          {error || subError}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px] overflow-hidden">

        <div className="flex flex-col min-w-0 overflow-hidden">

          <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-clash-border bg-clash-surface/60 overflow-x-auto">

            <span className="text-xs text-clash-dim font-display uppercase tracking-widest shrink-0">
              Lang:
            </span>

            {LANGUAGES.map(l => (

              <button
                key={l.value}
                onClick={() => changeLang(l.value)}
                className={`px-3 py-1 rounded text-xs font-display font-semibold border transition-all shrink-0
                ${myLang === l.value
                  ? 'bg-clash-cyan/20 border-clash-cyan/50 text-clash-cyan'
                  : 'border-clash-border text-clash-dim hover:border-clash-cyan/20'}`}
              >
                {l.label}
              </button>

            ))}

          </div>

          <div className="flex-1 min-h-0 p-2">

            <CodeEditor
              value={myCode}
              language={myLang}
              onChange={handleCodeChange}
              onCursorChange={handleCursor}
              readOnly={false}
              label={`${user?.displayName} (you)`}
            />

          </div>

          <div className="h-44 overflow-auto border-t border-clash-border bg-black p-4">

            <div className="flex items-center justify-between mb-2">
              <div className="text-clash-cyan text-sm font-bold">
                Output
              </div>
              <span className="text-xs text-clash-dim font-mono">
                {roomStatus}
              </span>
            </div>

            <pre className="text-white text-sm whitespace-pre-wrap">
              {output}
            </pre>

          </div>

        </div>

        <aside className="border-t xl:border-t-0 xl:border-l border-clash-border bg-clash-bg/80 overflow-y-auto">

          <div className="p-4 space-y-4">

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-clash-border bg-clash-surface p-3">
                <div className="text-xs text-clash-dim font-display uppercase tracking-widest">Players</div>
                <div className="text-xl font-display font-bold text-clash-cyan mt-1">{participantCount}/4</div>
              </div>
              <div className="rounded-lg border border-clash-border bg-clash-surface p-3">
                <div className="text-xs text-clash-dim font-display uppercase tracking-widest">Subs</div>
                <div className="text-xl font-display font-bold text-clash-green mt-1">{submissions.length}</div>
              </div>
              <div className="rounded-lg border border-clash-border bg-clash-surface p-3">
                <div className="text-xs text-clash-dim font-display uppercase tracking-widest">Room</div>
                <div className="text-xl font-display font-bold text-clash-amber mt-1 capitalize">{roomStatus}</div>
              </div>
            </div>

            <section className="rounded-xl border border-clash-border bg-clash-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-sm text-clash-text tracking-wide">
                  Participants
                </h2>
                <span className="text-xs text-clash-dim font-mono">{others.length} viewing options</span>
              </div>

              <ParticipantList
                participants={participants}
                currentUserId={user?.id}
                selectedUserId={selectedUser}
                onSelectParticipant={setSelected}
              />
            </section>

            {viewing && (
              <section className="h-72 rounded-xl border border-clash-purple/30 bg-clash-surface p-2">
                <CodeEditor
                  value={viewing.code || ''}
                  language={viewing.language || 'python'}
                  readOnly
                  blurred
                  isTyping={viewing.isTyping}
                  label={`${viewing.displayName}'s live code`}
                />
              </section>
            )}

            <section className="rounded-xl border border-clash-border bg-clash-surface">
              <div className="flex border-b border-clash-border">
                {['challenge', 'leaderboard'].map(panel => (
                  <button
                    key={panel}
                    type="button"
                    onClick={() => setPanel(panel)}
                    className={`flex-1 px-3 py-2 text-xs font-display font-semibold uppercase tracking-widest transition-colors
                    ${activePanel === panel
                      ? 'text-clash-cyan bg-clash-cyan/10'
                      : 'text-clash-dim hover:text-clash-text'}`}
                  >
                    {panel}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activePanel === 'challenge' ? (
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-display font-bold text-base text-clash-text">
                        {challenge?.title || 'Challenge'}
                      </h2>
                      <p className="text-sm text-clash-dim leading-relaxed mt-2 whitespace-pre-wrap">
                        {challenge?.problem || 'Loading...'}
                      </p>
                    </div>

                    {challenge?.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {challenge.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                      </div>
                    )}
                  </div>
                ) : (
                  <Leaderboard submissions={submissions} currentUserId={user?.id} />
                )}
              </div>
            </section>

            {isCreator && roomStatus === 'waiting' && (
              <button
                onClick={startRoom}
                className="btn-primary w-full justify-center"
              >
                Start Room
              </button>
            )}

          </div>
        </aside>
      </div>
    </div>
  );

}
