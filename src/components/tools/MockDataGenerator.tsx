import React, { useMemo, useState } from 'react';
import { Check, Copy, Plus, RefreshCw, X } from 'lucide-react';

interface MockDataGeneratorProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const FIRST = ['Ann', 'Ben', 'Cara', 'Dan', 'Eva', 'Finn', 'Gina', 'Hugo', 'Iris', 'Jack', 'Kira', 'Leo', 'Mia', 'Noah', 'Olive', 'Paul', 'Quinn', 'Rosa', 'Sam', 'Tara'];
const LAST = ['Smith', 'Johnson', 'Lee', 'Brown', 'Garcia', 'Miller', 'Davis', 'Chen', 'Wang', 'Kim', 'Patel', 'Lopez', 'Nguyen', 'Clark', 'Young', 'Hall'];
const CITIES = ['Taipei', 'Tokyo', 'Seoul', 'London', 'Paris', 'Berlin', 'New York', 'Austin', 'Toronto', 'Sydney', 'Singapore', 'Madrid'];
const COUNTRIES = ['Taiwan', 'Japan', 'South Korea', 'United Kingdom', 'France', 'Germany', 'United States', 'Canada', 'Australia', 'Singapore', 'Spain'];
const STREETS = ['Main St', 'Oak Ave', 'Maple Rd', 'Park Blvd', 'Cedar Ln', 'Sunset Dr', 'River Rd', 'Hill St'];
const COMPANIES = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark', 'Wayne', 'Soylent', 'Vandelay', 'Pied Piper'];
const SUFFIX = ['Inc', 'LLC', 'Ltd', 'Group', 'Labs', 'Co'];
const DOMAINS = ['example.com', 'example.org', 'test.dev', 'mail.test'];
const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur'.split(' ');

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(a: T[]): T => a[rand(0, a.length - 1)];
const sentence = (n = rand(6, 12)) => {
  const s = Array.from({ length: n }, () => pick(LOREM)).join(' ');
  return s[0].toUpperCase() + s.slice(1) + '.';
};
const paragraph = () => Array.from({ length: rand(3, 6) }, () => sentence()).join(' ');

type Gen = () => string | number | boolean;
const TYPES: Record<string, { label: string; gen: Gen }> = {
  uuid: { label: 'UUID', gen: () => crypto.randomUUID() },
  firstName: { label: 'First name', gen: () => pick(FIRST) },
  lastName: { label: 'Last name', gen: () => pick(LAST) },
  fullName: { label: 'Full name', gen: () => `${pick(FIRST)} ${pick(LAST)}` },
  email: { label: 'Email', gen: () => `${pick(FIRST)}.${pick(LAST)}${rand(1, 99)}@${pick(DOMAINS)}`.toLowerCase() },
  phone: { label: 'Phone', gen: () => `+1-${rand(200, 999)}-${rand(200, 999)}-${rand(1000, 9999)}` },
  street: { label: 'Street address', gen: () => `${rand(1, 999)} ${pick(STREETS)}` },
  city: { label: 'City', gen: () => pick(CITIES) },
  country: { label: 'Country', gen: () => pick(COUNTRIES) },
  zip: { label: 'Postal code', gen: () => String(rand(10000, 99999)) },
  company: { label: 'Company', gen: () => `${pick(COMPANIES)} ${pick(SUFFIX)}` },
  int: { label: 'Integer (1–1000)', gen: () => rand(1, 1000) },
  float: { label: 'Decimal (0–100)', gen: () => +(Math.random() * 100).toFixed(2) },
  bool: { label: 'Boolean', gen: () => Math.random() < 0.5 },
  date: { label: 'Date (past 5y)', gen: () => new Date(Date.now() - rand(0, 5 * 365) * 86400000).toISOString().slice(0, 10) },
  datetime: { label: 'ISO datetime', gen: () => new Date(Date.now() - rand(0, 5 * 365 * 86400) * 1000).toISOString() },
  ip: { label: 'IPv4', gen: () => `${rand(1, 254)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}` },
  url: { label: 'URL', gen: () => `https://${pick(DOMAINS)}/${pick(LOREM)}/${rand(1, 999)}` },
  word: { label: 'Word', gen: () => pick(LOREM) },
  sentence: { label: 'Sentence', gen: () => sentence() },
};

interface Field { id: number; name: string; type: string }
type Format = 'json' | 'csv' | 'sql';

const csvCell = (v: unknown) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const sqlVal = (v: unknown) => (typeof v === 'number' ? String(v) : typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : `'${String(v).replace(/'/g, "''")}'`);

const MockDataGenerator: React.FC<MockDataGeneratorProps> = ({ onCopy, copyStatus }) => {
  const [mode, setMode] = useState<'records' | 'lorem'>('records');
  const [fields, setFields] = useState<Field[]>([
    { id: 1, name: 'id', type: 'uuid' },
    { id: 2, name: 'name', type: 'fullName' },
    { id: 3, name: 'email', type: 'email' },
    { id: 4, name: 'createdAt', type: 'datetime' },
  ]);
  const [count, setCount] = useState(5);
  const [format, setFormat] = useState<Format>('json');
  const [table, setTable] = useState('users');
  const [seed, setSeed] = useState(0);
  const [paras, setParas] = useState(3);
  const [nextId, setNextId] = useState(5);

  const output = useMemo(() => {
    void seed; // regenerate when the user clicks Regenerate
    if (mode === 'lorem') return Array.from({ length: paras }, paragraph).join('\n\n');
    const valid = fields.filter((f) => f.name.trim());
    if (!valid.length) return '';
    const rows = Array.from({ length: Math.min(Math.max(count, 1), 1000) }, () =>
      Object.fromEntries(valid.map((f) => [f.name.trim(), TYPES[f.type].gen()])));
    const keys = valid.map((f) => f.name.trim());
    if (format === 'json') return JSON.stringify(rows, null, 2);
    if (format === 'csv') return [keys.join(','), ...rows.map((r) => keys.map((k) => csvCell(r[k])).join(','))].join('\n');
    return rows.map((r) => `INSERT INTO ${table || 'table_name'} (${keys.join(', ')}) VALUES (${keys.map((k) => sqlVal(r[k])).join(', ')});`).join('\n');
  }, [mode, fields, count, format, table, seed, paras]);

  const update = (id: number, patch: Partial<Field>) => setFields((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${active ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`;
  const inp = 'px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white';

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Mock Data Generator</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {([['records', 'Records'], ['lorem', 'Lorem Ipsum']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setMode(id)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
          ))}
        </div>
      </div>

      {mode === 'records' ? (
        <>
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            {fields.map((f) => (
              <div key={f.id} className="flex gap-2 items-center">
                <input className={`${inp} flex-1 font-mono`} value={f.name} placeholder="field name" onChange={(e) => update(f.id, { name: e.target.value })} />
                <select className={`${inp} w-48`} value={f.type} onChange={(e) => update(f.id, { type: e.target.value })}>
                  {Object.entries(TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
                </select>
                <button onClick={() => setFields((fs) => fs.filter((x) => x.id !== f.id))} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors" title="Remove field"><X size={16} /></button>
              </div>
            ))}
            <button
              onClick={() => { setFields((fs) => [...fs, { id: nextId, name: `field${nextId}`, type: 'word' }]); setNextId(nextId + 1); }}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium pt-1"
            >
              <Plus size={14} /> Add field
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(['json', 'csv', 'sql'] as Format[]).map((f) => <button key={f} onClick={() => setFormat(f)} className={chip(format === f)}>{f.toUpperCase()}</button>)}
            {format === 'sql' && <input className={`${inp} w-36 font-mono`} value={table} onChange={(e) => setTable(e.target.value)} placeholder="table name" />}
            <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
              Rows
              <input type="number" min={1} max={1000} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} className={`${inp} w-24`} />
            </label>
          </div>
        </>
      ) : (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Paragraphs
          <input type="number" min={1} max={20} value={paras} onChange={(e) => setParas(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} className={`${inp} w-24`} />
        </label>
      )}

      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Output</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setSeed((s) => s + 1)} className="p-2 rounded-lg flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"><RefreshCw size={14} /> Regenerate</button>
            <button
              onClick={() => output && onCopy(output, 'mock-data')}
              disabled={!output}
              className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${copyStatus === 'mock-data' ? 'bg-green-500/10 text-green-400' : 'text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30'}`}
            >
              {copyStatus === 'mock-data' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
        </div>
        <pre className="min-h-[100px] max-h-[420px] p-4 font-mono text-sm overflow-auto whitespace-pre-wrap leading-relaxed text-blue-300/90">{output || <span className="text-slate-500 italic">Add at least one field…</span>}</pre>
      </div>
    </div>
  );
};

export default MockDataGenerator;
