import React, { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';

interface TextCaseConverterProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const toWords = (str: string): string[] =>
  str
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.toLowerCase());

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

const CASES = [
  { id: 'camel',     label: 'camelCase',          fn: (w: string[]) => w.map((x, i) => i === 0 ? x : cap(x)).join('') },
  { id: 'pascal',    label: 'PascalCase',          fn: (w: string[]) => w.map(cap).join('') },
  { id: 'snake',     label: 'snake_case',          fn: (w: string[]) => w.join('_') },
  { id: 'screaming', label: 'SCREAMING_SNAKE_CASE',fn: (w: string[]) => w.join('_').toUpperCase() },
  { id: 'kebab',     label: 'kebab-case',          fn: (w: string[]) => w.join('-') },
  { id: 'cobol',     label: 'COBOL-CASE',          fn: (w: string[]) => w.join('-').toUpperCase() },
  { id: 'title',     label: 'Title Case',          fn: (w: string[]) => w.map(cap).join(' ') },
  { id: 'sentence',  label: 'Sentence case',       fn: (w: string[]) => { const s = w.join(' '); return s.charAt(0).toUpperCase() + s.slice(1); } },
  { id: 'upper',     label: 'UPPER CASE',          fn: (w: string[]) => w.join(' ').toUpperCase() },
  { id: 'lower',     label: 'lower case',          fn: (w: string[]) => w.join(' ') },
];

const TextCaseConverter: React.FC<TextCaseConverterProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState('');

  const words = useMemo(() => toWords(input), [input]);

  const results = useMemo(
    () => CASES.map(c => ({ ...c, value: words.length > 0 ? c.fn(words) : '' })),
    [words]
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">Text Case Converter</h2>

      <input
        className="w-full p-4 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
        placeholder="Enter text (e.g. hello world, myVariableName, my_var_name)"
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {results.map(({ id, label, value }) => (
          <div
            key={id}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 hover:border-indigo-200 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
              <div className="font-mono text-sm text-slate-700 truncate mt-0.5">
                {value || <span className="text-slate-300 italic">—</span>}
              </div>
            </div>
            <button
              onClick={() => value && onCopy(value, `case-${id}`)}
              disabled={!value}
              className={`shrink-0 p-1.5 rounded-lg transition-all ${
                copyStatus === `case-${id}`
                  ? 'text-green-500'
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30'
              }`}
            >
              {copyStatus === `case-${id}` ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TextCaseConverter;
