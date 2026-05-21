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
        'error'
      ].forEach(e => socket.off(e));

      socket.disconnect();

    };

  }, [roomId, user]);

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

      <div className="flex-1 flex overflow-hidden">

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-clash-border bg-clash-surface/60">

            <span className="text-xs text-clash-dim font-display uppercase tracking-widest">
              Lang:
            </span>

            {LANGUAGES.map(l => (

              <button
                key={l.value}
                onClick={() => changeLang(l.value)}
                className={`px-3 py-1 rounded text-xs font-display font-semibold border transition-all
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

            <div className="text-clash-cyan text-sm font-bold mb-2">
              Output
            </div>

            <pre className="text-white text-sm whitespace-pre-wrap">
              {output}
            </pre>

          </div>

        </div>
      </div>
    </div>
  );

}
