import React, { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import YAML from 'yaml';

interface JsonConverterProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

type Mode = 'json-yaml' | 'yaml-json' | 'json-csv' | 'csv-json';

const MODES: { id: Mode; label: string; inLabel: string; outLabel: string; placeholder: string }[] = [
  { id: 'json-yaml', label: 'JSON → YAML', inLabel: 'JSON', outLabel: 'YAML', placeholder: '{"name": "toolbox", "tags": ["a", "b"]}' },
  { id: 'yaml-json', label: 'YAML → JSON', inLabel: 'YAML', outLabel: 'JSON', placeholder: 'name: toolbox\ntags:\n  - a\n  - b' },
  { id: 'json-csv', label: 'JSON → CSV', inLabel: 'JSON (array of objects)', outLabel: 'CSV', placeholder: '[{"id": 1, "name": "Ann"}, {"id": 2, "name": "Bob"}]' },
  { id: 'csv-json', label: 'CSV → JSON', inLabel: 'CSV (first row = header)', outLabel: 'JSON', placeholder: 'id,name\n1,Ann\n2,Bob' },
];

type Flat = Record<string, unknown>;

function flatten(value: unknown, prefix = '', out: Flat = {}): Flat {
  if (Array.isArray(value)) {
    value.forEach((v, i) => flatten(v, prefix ? `${prefix}.${i}` : String(i), out));
  } else if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out[prefix] = value;
  }
  return out;
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function jsonToCsv(text: string): string {
  const data = JSON.parse(text);
  const rows = (Array.isArray(data) ? data : [data]).map((r) => flatten(r));
  const headers: string[] = [];
  rows.forEach((r) => Object.keys(r).forEach((k) => headers.includes(k) || headers.push(k)));
  return [headers.map(csvCell).join(','), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(','))].join('\n');
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c !== ''));
}

function inferValue(s: string): unknown {
  if (s === '') return '';
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null') return null;
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

function csvToJson(text: string): string {
  const [header, ...rows] = parseCsv(text);
  if (!header) return '[]';
  const out = rows.map((r) => Object.fromEntries(header.map((h, i) => [h, inferValue(r[i] ?? '')])));
  return JSON.stringify(out, null, 2);
}

function convert(mode: Mode, text: string): string {
  switch (mode) {
    case 'json-yaml': return YAML.stringify(JSON.parse(text));
    case 'yaml-json': return JSON.stringify(YAML.parse(text), null, 2);
    case 'json-csv': return jsonToCsv(text);
    case 'csv-json': return csvToJson(text);
  }
}

const JsonConverter: React.FC<JsonConverterProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('json-yaml');
  const cfg = MODES.find((m) => m.id === mode)!;

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' };
    try {
      return { output: convert(mode, input), error: '' };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : 'Conversion failed' };
    }
  }, [input, mode]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">JSON Converter</h2>

      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              mode === m.id ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cfg.inLabel} Input</label>
        <textarea
          className="w-full h-48 p-4 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
          placeholder={cfg.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{cfg.outLabel} Output</span>
          <button
            onClick={() => output && onCopy(output, 'json-convert')}
            disabled={!output}
            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${
              copyStatus === 'json-convert' ? 'bg-green-500/10 text-green-400' : 'text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30'
            }`}
          >
            {copyStatus === 'json-convert' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
        <pre className={`min-h-[100px] max-h-[420px] p-4 font-mono text-sm overflow-auto leading-relaxed ${error ? 'text-red-400' : 'text-blue-300/90'}`}>
          {error || output || <span className="text-slate-500 italic">Output will appear here...</span>}
        </pre>
      </div>
    </div>
  );
};

export default JsonConverter;
