import React, { useState, useMemo, useRef } from 'react';
import {
  ChevronRight,
  Copy,
  Check,
  Upload,
  Download,
  Trash2,
  Code2,
  ListTree,
  Minimize2,
  AlertTriangle,
} from 'lucide-react';

interface JsonFormatterProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

interface ErrorLocation {
  line: number;
  col: number;
}

const getErrorLocation = (input: string, message: string): ErrorLocation | null => {
  const match = message.match(/position (\d+)/);
  if (!match) return null;
  const pos = Number(match[1]);
  const upToPos = input.slice(0, pos);
  const lines = upToPos.split('\n');
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
};

const renderPrimitive = (value: unknown): React.ReactNode => {
  if (typeof value === 'string') return <span className="text-emerald-600">"{value}"</span>;
  if (typeof value === 'number') return <span className="text-blue-600">{value}</span>;
  if (typeof value === 'boolean') return <span className="text-amber-600">{String(value)}</span>;
  if (value === null) return <span className="text-slate-400 italic">null</span>;
  return null;
};

const TreeNode: React.FC<{ nodeKey: string | null; value: unknown; depth: number }> = ({ nodeKey, value, depth }) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const pad = depth * 16;
  const isObj = value !== null && typeof value === 'object';
  const keyLabel = nodeKey !== null && (
    <span className="text-indigo-600 font-medium">"{nodeKey}": </span>
  );

  if (!isObj) {
    return (
      <div style={{ paddingLeft: pad }} className="font-mono text-xs py-0.5">
        {keyLabel}
        {renderPrimitive(value)}
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries: [string, unknown][] = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v])
    : Object.entries(value as Record<string, unknown>);
  const [open, close] = isArray ? ['[', ']'] : ['{', '}'];

  return (
    <>
      <div
        style={{ paddingLeft: pad }}
        onClick={() => setExpanded(x => !x)}
        className="font-mono text-xs py-0.5 flex items-center gap-1 cursor-pointer hover:bg-slate-50 rounded"
      >
        <ChevronRight size={11} className={`shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        {keyLabel}
        <span className="text-slate-500">{open}</span>
        {!expanded && (
          <span className="text-slate-400 italic">
            {entries.length} item{entries.length !== 1 ? 's' : ''} {close}
          </span>
        )}
      </div>
      {expanded && entries.map(([k, v]) => (
        <TreeNode key={k} nodeKey={isArray ? null : k} value={v} depth={depth + 1} />
      ))}
      {expanded && <div style={{ paddingLeft: pad + 15 }} className="font-mono text-xs text-slate-500">{close}</div>}
    </>
  );
};

const JsonFormatter: React.FC<JsonFormatterProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState('');
  const [viewMode, setViewMode] = useState<'code' | 'tree'>('code');
  const [minified, setMinified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseResult = useMemo(() => {
    if (!input.trim()) return { data: undefined as unknown, error: null as string | null };
    try {
      return { data: JSON.parse(input) as unknown, error: null as string | null };
    } catch (e) {
      return { data: undefined as unknown, error: (e as Error).message };
    }
  }, [input]);

  const errorLocation = useMemo(
    () => (parseResult.error ? getErrorLocation(input, parseResult.error) : null),
    [parseResult.error, input]
  );

  const formatted = useMemo(() => {
    if (parseResult.error || input.trim() === '') return '';
    return minified ? JSON.stringify(parseResult.data) : JSON.stringify(parseResult.data, null, 2);
  }, [parseResult, minified, input]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setInput(String(reader.result ?? ''));
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownload = () => {
    if (!formatted) return;
    const blob = new Blob([formatted], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = minified ? 'data.min.json' : 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-2xl font-bold">JSON Formatter</h2>

      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleUpload} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Upload size={13} /> Upload
        </button>
        <button
          onClick={handleDownload}
          disabled={!formatted}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={13} /> Download
        </button>
        <button
          onClick={() => formatted && onCopy(formatted, 'json-formatted')}
          disabled={!formatted}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {copyStatus === 'json-formatted' ? <Check size={13} className="text-green-500" /> : <Copy size={13} />} Copy
        </button>
        <button
          onClick={() => setMinified(m => !m)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
            minified ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Minimize2 size={13} /> Minify
        </button>
        <button
          onClick={() => setInput('')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Trash2 size={13} /> Clear
        </button>

        <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'code' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Code2 size={13} /> Code
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'tree' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ListTree size={13} /> Tree
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea
          className="h-96 p-3 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
          placeholder="Paste minified JSON..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />

        <div className="h-96 rounded-lg overflow-hidden border border-slate-800 flex flex-col">
          {parseResult.error ? (
            <div className="flex-1 p-3 bg-slate-900 overflow-auto">
              <div className="flex items-start gap-2 text-red-400 text-xs">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Invalid JSON</div>
                  <div className="mt-1 text-red-300/90">{parseResult.error}</div>
                  {errorLocation && (
                    <div className="mt-1 text-red-300/70">
                      Line {errorLocation.line}, Column {errorLocation.col}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : viewMode === 'code' ? (
            <pre className="flex-1 p-3 bg-slate-900 text-blue-300 overflow-auto text-xs leading-relaxed">
              {formatted || '// Formatted JSON will appear here'}
            </pre>
          ) : (
            <div className="flex-1 p-3 bg-white overflow-auto">
              {parseResult.data !== undefined ? (
                <TreeNode nodeKey={null} value={parseResult.data} depth={0} />
              ) : (
                <span className="text-slate-300 italic text-xs">Tree view will appear here</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonFormatter;
