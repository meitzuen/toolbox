import React, { useState, useMemo } from 'react';
import { Copy, Check, Trash2, Wand2 } from 'lucide-react';

interface ListPrettifierProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

type QuoteStyle = 'none' | 'single' | 'double';
type WrapStyle = 'none' | 'brackets' | 'parens' | 'sql-in';

const QUOTE_OPTIONS: { id: QuoteStyle; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'single', label: "' '" },
  { id: 'double', label: '" "' },
];

const WRAP_OPTIONS: { id: WrapStyle; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'brackets', label: '[ ]' },
  { id: 'parens', label: '( )' },
  { id: 'sql-in', label: 'IN (...)' },
];

const quoteItem = (item: string, style: QuoteStyle) => {
  if (style === 'single') return `'${item}'`;
  if (style === 'double') return `"${item}"`;
  return item;
};

const ListPrettifier: React.FC<ListPrettifierProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState('');
  const [quoteStyle, setQuoteStyle] = useState<QuoteStyle>('single');
  const [wrapStyle, setWrapStyle] = useState<WrapStyle>('sql-in');
  const [trailingComma, setTrailingComma] = useState(false);
  const [dedupe, setDedupe] = useState(true);
  const [sort, setSort] = useState(false);

  const isWrapped = wrapStyle !== 'none';
  const trailingCommaDisabled = wrapStyle === 'sql-in';

  const output = useMemo(() => {
    let items = input
      .replace(/,/g, '\n')
      .split('\n')
      .map(i => i.trim())
      .filter(Boolean);

    if (dedupe) items = Array.from(new Set(items));
    if (sort) items = [...items].sort((a, b) => a.localeCompare(b));

    if (items.length === 0) return '';

    const useTrailingComma = trailingComma && !trailingCommaDisabled;
    const indent = isWrapped ? '  ' : '';
    const lines = items.map((item, i) => {
      const isLast = i === items.length - 1;
      const comma = isLast && !useTrailingComma ? '' : ',';
      return `${indent}${quoteItem(item, quoteStyle)}${comma}`;
    });

    switch (wrapStyle) {
      case 'brackets':
        return `[\n${lines.join('\n')}\n]`;
      case 'parens':
        return `(\n${lines.join('\n')}\n)`;
      case 'sql-in':
        return `IN (\n${lines.join('\n')}\n)`;
      default:
        return lines.join('\n');
    }
  }, [input, quoteStyle, wrapStyle, trailingComma, trailingCommaDisabled, dedupe, sort, isWrapped]);

  const itemCount = useMemo(
    () => new Set(
      input.replace(/,/g, '\n').split('\n').map(i => i.trim()).filter(Boolean)
    ).size,
    [input]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
          <Wand2 size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">List Prettifier</h2>
          <p className="text-slate-500 text-sm">Turn a raw pasted list into a quoted, wrapped list</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-slate-700">Input List</label>
          <button
            onClick={() => setInput('')}
            className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
        <textarea
          placeholder={'Paste your items here (comma or newline separated)...\nExample:\n0324855C01D4490B00030000000070979A3C\n039DF95C01D4490B00030000000070979A3D'}
          className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quote Style</label>
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              {QUOTE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setQuoteStyle(opt.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    quoteStyle === opt.id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wrap</label>
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              {WRAP_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setWrapStyle(opt.id)}
                  className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    wrapStyle === opt.id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-5 pt-1">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={dedupe} onChange={e => setDedupe(e.target.checked)} className="rounded accent-indigo-600" />
            Remove duplicates
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={sort} onChange={e => setSort(e.target.checked)} className="rounded accent-indigo-600" />
            Sort alphabetically
          </label>
          <label className={`flex items-center gap-2 text-sm cursor-pointer select-none ${trailingCommaDisabled ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600'}`}>
            <input
              type="checkbox"
              checked={trailingComma && !trailingCommaDisabled}
              disabled={trailingCommaDisabled}
              onChange={e => setTrailingComma(e.target.checked)}
              className="rounded accent-indigo-600"
            />
            Trailing comma
          </label>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <span className="text-xs font-semibold text-slate-300">Output ({itemCount})</span>
          <button
            onClick={() => output && onCopy(output, 'list-pretty')}
            disabled={!output}
            className="p-1.5 rounded-md text-slate-300 hover:bg-white/10 disabled:opacity-30 transition-colors"
          >
            {copyStatus === 'list-pretty' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
        <pre className="p-5 font-mono text-sm text-slate-100 whitespace-pre-wrap break-all max-h-80 overflow-y-auto">
          {output || <span className="text-slate-500 italic">Prettified list will appear here</span>}
        </pre>
      </div>
    </div>
  );
};

export default ListPrettifier;
