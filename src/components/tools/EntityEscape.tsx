import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, Check, Copy } from 'lucide-react';

interface EntityEscapeProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

type Format = 'html' | 'unicode' | 'codepoint';
type Mode = 'encode' | 'decode';

const FORMATS: { id: Format; label: string; sample: string }[] = [
  { id: 'html', label: 'HTML Entities', sample: '<p class="a">café — 你好 & 😀</p>' },
  { id: 'unicode', label: '\\uXXXX', sample: 'café — 你好 😀' },
  { id: 'codepoint', label: '\\u{X}', sample: 'café — 你好 😀' },
];

const HTML_BASIC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function encode(format: Format, src: string, all: boolean): string {
  const needs = (cp: number) => (all ? true : cp > 127);
  let out = '';
  for (const ch of src) {
    const cp = ch.codePointAt(0)!;
    if (format === 'html') {
      if (HTML_BASIC[ch]) out += HTML_BASIC[ch];
      else if (cp > 127 || (all && !/[\w\s]/.test(ch))) out += `&#x${cp.toString(16).toUpperCase()};`;
      else out += ch;
    } else if (!needs(cp)) {
      out += ch;
    } else if (format === 'codepoint') {
      out += `\\u{${cp.toString(16).toUpperCase()}}`;
    } else if (cp > 0xffff) {
      const v = cp - 0x10000;
      out += [0xd800 + (v >> 10), 0xdc00 + (v & 0x3ff)].map((u) => `\\u${u.toString(16).toUpperCase().padStart(4, '0')}`).join('');
    } else {
      out += `\\u${cp.toString(16).toUpperCase().padStart(4, '0')}`;
    }
  }
  return out;
}

function decode(format: Format, src: string): string {
  if (format === 'html') {
    return new DOMParser().parseFromString(src, 'text/html').documentElement.textContent ?? '';
  }
  return src
    .replace(/\\u\{([0-9a-fA-F]{1,6})\}/g, (m, h) => {
      const cp = parseInt(h, 16);
      return cp > 0x10ffff ? m : String.fromCodePoint(cp);
    })
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

const EntityEscape: React.FC<EntityEscapeProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState('');
  const [format, setFormat] = useState<Format>('html');
  const [mode, setMode] = useState<Mode>('encode');
  const [all, setAll] = useState(false);

  const output = useMemo(() => {
    if (!input) return '';
    return mode === 'encode' ? encode(format, input, all) : decode(format, input);
  }, [input, format, mode, all]);

  const cfg = FORMATS.find((f) => f.id === format)!;
  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${active ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">HTML Entity / Unicode Escape</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['encode', 'decode'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${mode === m ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FORMATS.map((f) => (
          <button key={f.id} onClick={() => setFormat(f.id)} className={chip(format === f.id)}>{f.label}</button>
        ))}
        {mode === 'encode' && (
          <label className="ml-auto flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
            {format === 'html' ? 'Escape all punctuation' : 'Escape ASCII too'}
          </label>
        )}
      </div>

      <textarea
        className="w-full h-40 p-4 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
        placeholder={mode === 'encode' ? cfg.sample : encode(format, cfg.sample, false)}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="flex justify-center">
        <button
          onClick={() => { setInput(output); setMode((m) => (m === 'encode' ? 'decode' : 'encode')); }}
          disabled={!output}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeftRight size={16} /> Swap &amp; Flip Mode
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{mode === 'encode' ? 'Escaped' : 'Decoded'}</span>
          <button
            onClick={() => output && onCopy(output, 'entity')}
            disabled={!output}
            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${
              copyStatus === 'entity' ? 'bg-green-500/10 text-green-400' : 'text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30'
            }`}
          >
            {copyStatus === 'entity' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
        <pre className="min-h-[100px] max-h-[320px] p-4 font-mono text-sm overflow-auto break-all whitespace-pre-wrap leading-relaxed text-blue-300/90">
          {output || <span className="text-slate-500 italic">Output will appear here...</span>}
        </pre>
      </div>
    </div>
  );
};

export default EntityEscape;
