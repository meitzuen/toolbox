import React, { useMemo, useState } from 'react';
import { Check, Copy, Undo2 } from 'lucide-react';

interface TextStatsProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const CJK = /[぀-ヿ㐀-䶿一-鿿가-힯]/g;

const lines = (t: string) => t.split(/\r?\n/);
const byLines = (fn: (l: string[]) => string[]) => (t: string) => fn(lines(t)).join('\n');
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const OPERATIONS: { group: string; items: { label: string; run: (t: string) => string }[] }[] = [
  {
    group: 'Whitespace',
    items: [
      { label: 'Trim lines', run: byLines((l) => l.map((x) => x.trim())) },
      { label: 'Remove empty lines', run: byLines((l) => l.filter((x) => x.trim() !== '')) },
      { label: 'Collapse spaces', run: byLines((l) => l.map((x) => x.replace(/[ \t]+/g, ' '))) },
      { label: 'Collapse blank lines', run: (t) => t.replace(/(\r?\n){3,}/g, '\n\n') },
      { label: 'Join into one line', run: (t) => lines(t).map((x) => x.trim()).filter(Boolean).join(' ') },
    ],
  },
  {
    group: 'Lines',
    items: [
      { label: 'Sort A → Z', run: byLines((l) => [...l].sort(collator.compare)) },
      { label: 'Sort Z → A', run: byLines((l) => [...l].sort((a, b) => collator.compare(b, a))) },
      { label: 'Reverse order', run: byLines((l) => [...l].reverse()) },
      { label: 'Remove duplicates', run: byLines((l) => [...new Set(l)]) },
      { label: 'Number lines', run: byLines((l) => l.map((x, i) => `${i + 1}. ${x}`)) },
    ],
  },
  {
    group: 'Case',
    items: [
      { label: 'UPPERCASE', run: (t) => t.toUpperCase() },
      { label: 'lowercase', run: (t) => t.toLowerCase() },
      { label: 'Capitalize words', run: (t) => t.toLowerCase().replace(/(^|\s)(\S)/g, (_, s, c) => s + c.toUpperCase()) },
    ],
  },
];

const TextStats: React.FC<TextStatsProps> = ({ onCopy, copyStatus }) => {
  const [text, setText] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const apply = (fn: (t: string) => string) => {
    const next = fn(text);
    if (next === text) return;
    setHistory((h) => [...h, text]);
    setText(next);
  };

  const undo = () => {
    if (!history.length) return;
    setText(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  };

  const stats = useMemo(() => {
    const cjk = (text.match(CJK) ?? []).length;
    const latinWords = (text.replace(CJK, ' ').match(/[^\s]+/g) ?? []).length;
    const words = latinWords + cjk;
    const nonEmpty = lines(text).filter((l) => l.trim()).length;
    return [
      { label: 'Characters', value: [...text].length },
      { label: 'No spaces', value: [...text.replace(/\s/g, '')].length },
      { label: 'Words', value: words },
      { label: 'CJK chars', value: cjk },
      { label: 'Lines', value: text ? lines(text).length : 0 },
      { label: 'Non-empty lines', value: nonEmpty },
      { label: 'Paragraphs', value: text.split(/\r?\n\s*\r?\n/).filter((p) => p.trim()).length },
      { label: 'Bytes (UTF-8)', value: new TextEncoder().encode(text).length },
      { label: 'Reading time', value: words ? `${Math.max(1, Math.round(words / 230))} min` : '0 min' },
    ];
  }, [text]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">Text Stats &amp; Cleanup</h2>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5">
            <div className="font-mono text-lg text-slate-800">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      <textarea
        className="w-full h-64 p-4 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
        placeholder="Paste or type text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="space-y-3">
        {OPERATIONS.map((g) => (
          <div key={g.group} className="flex flex-wrap items-center gap-2">
            <span className="w-24 text-xs font-bold text-slate-400 uppercase tracking-wider">{g.group}</span>
            {g.items.map((op) => (
              <button
                key={op.label}
                onClick={() => apply(op.run)}
                disabled={!text}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 transition-all"
              >
                {op.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={undo}
          disabled={!history.length}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-300 disabled:opacity-30 transition-all"
        >
          <Undo2 size={15} /> Undo
        </button>
        <button
          onClick={() => text && onCopy(text, 'text-stats')}
          disabled={!text}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-300 disabled:opacity-30 transition-all"
        >
          {copyStatus === 'text-stats' ? <><Check size={15} className="text-green-500" /> Copied</> : <><Copy size={15} /> Copy text</>}
        </button>
      </div>
    </div>
  );
};

export default TextStats;
