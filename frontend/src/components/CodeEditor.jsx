import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const OPTS = {
  fontSize: 14,
  fontFamily: '"Fira Code", "Cascadia Code", monospace',
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  tabSize: 4,
  automaticLayout: true,
  padding: { top: 12, bottom: 12 },
  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
};

export default function CodeEditor({
  value, language = 'python', onChange, onCursorChange,
  readOnly = false, label, isTyping = false,
}) {
  const editorRef = useRef(null);

  // Keep read-only mirror in sync
  useEffect(() => {
    if (readOnly && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model && model.getValue() !== value) model.setValue(value || '');
    }
  }, [value, readOnly]);

  function handleMount(editor) {
    editorRef.current = editor;
    if (!readOnly) {
      editor.onDidChangeCursorPosition(e =>
        onCursorChange?.({ lineNumber: e.position.lineNumber, column: e.position.column })
      );
    }
  }

  return (
    <div className={`flex flex-col h-full rounded-xl overflow-hidden border
                     ${readOnly
                       ? 'border-clash-border'
                       : 'border-clash-cyan/40 shadow-[0_0_20px_rgba(0,229,255,0.08)]'}`}>
      {label && (
        <div className={`flex items-center justify-between px-4 py-2 shrink-0
                         border-b font-display text-xs font-semibold tracking-wider
                         ${readOnly
                           ? 'bg-clash-surface border-clash-border text-clash-dim'
                           : 'bg-clash-cyan/10 border-clash-cyan/30 text-clash-cyan'}`}>
          <div className="flex items-center gap-2">
            <span className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-clash-red/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-clash-amber/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-clash-green/60" />
            </span>
            <span>{label}</span>
          </div>
          <div className="flex items-center gap-2">
            {isTyping && <span className="text-clash-amber animate-pulse">✏ typing</span>}
            {readOnly  && <span className="text-clash-dim">👁 read-only</span>}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language}
          value={value}
          theme="vs-dark"
          options={{ ...OPTS, readOnly, cursorStyle: readOnly ? 'block' : 'line' }}
          onChange={val => !readOnly && onChange?.(val || '')}
          onMount={handleMount}
          loading={
            <div className="flex items-center justify-center h-full text-clash-dim text-sm">
              Loading editor…
            </div>
          }
        />
      </div>
    </div>
  );
}