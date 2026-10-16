import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface ChmodCalculatorProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const ROLES = ['Owner', 'Group', 'Other'] as const;
const PERMS = [
  { label: 'Read', bit: 4, ch: 'r' },
  { label: 'Write', bit: 2, ch: 'w' },
  { label: 'Execute', bit: 1, ch: 'x' },
] as const;
const SPECIAL = [
  { label: 'setuid', bit: 0o4000 },
  { label: 'setgid', bit: 0o2000 },
  { label: 'sticky', bit: 0o1000 },
] as const;

const PRESETS = [
  { mode: 0o644, note: 'Files (default)' },
  { mode: 0o755, note: 'Executables / dirs' },
  { mode: 0o600, note: 'Private files, SSH keys' },
  { mode: 0o700, note: 'Private dirs' },
  { mode: 0o777, note: 'Everyone — avoid' },
  { mode: 0o1777, note: '/tmp-style sticky dir' },
];

const shift = (role: number) => (2 - role) * 3;

function symbolic(mode: number): string {
  return ROLES.map((_, role) => {
    const bits = (mode >> shift(role)) & 7;
    const x = bits & 1;
    let out = (bits & 4 ? 'r' : '-') + (bits & 2 ? 'w' : '-');
    const special = role === 0 ? mode & 0o4000 : role === 1 ? mode & 0o2000 : mode & 0o1000;
    if (role === 2) out += special ? (x ? 't' : 'T') : x ? 'x' : '-';
    else out += special ? (x ? 's' : 'S') : x ? 'x' : '-';
    return out;
  }).join('');
}

const octal = (mode: number) => mode.toString(8).padStart(mode > 0o777 ? 4 : 3, '0');

const ChmodCalculator: React.FC<ChmodCalculatorProps> = ({ onCopy, copyStatus }) => {
  const [mode, setMode] = useState(0o644);
  const [octalInput, setOctalInput] = useState<string | null>(null);
  const [path, setPath] = useState('file.txt');

  const toggle = (bit: number) => { setOctalInput(null); setMode((m) => m ^ bit); };

  const onOctal = (v: string) => {
    setOctalInput(v);
    if (/^[0-7]{3,4}$/.test(v)) setMode(parseInt(v, 8));
  };

  const command = `chmod ${octal(mode)} ${path || 'file'}`;
  const sym = symbolic(mode);
  const copyBtn = (text: string, id: string) => (
    <button onClick={() => onCopy(text, id)} className={`shrink-0 p-1.5 rounded-lg transition-all ${copyStatus === id ? 'text-green-500' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
      {copyStatus === id ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">Chmod Calculator</h2>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
              <th className="text-left px-4 py-2.5 font-bold" />
              {PERMS.map((p) => <th key={p.label} className="px-4 py-2.5 font-bold">{p.label}</th>)}
              <th className="px-4 py-2.5 font-bold">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ROLES.map((role, r) => (
              <tr key={role}>
                <td className="px-4 py-3 font-medium text-slate-700">{role}</td>
                {PERMS.map((p) => (
                  <td key={p.label} className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={((mode >> shift(r)) & p.bit) !== 0}
                      onChange={() => toggle(p.bit << shift(r))}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                    />
                  </td>
                ))}
                <td className="px-4 py-3 text-center font-mono text-slate-600">{(mode >> shift(r)) & 7}</td>
              </tr>
            ))}
            <tr className="bg-slate-50/50">
              <td className="px-4 py-3 font-medium text-slate-700">Special</td>
              {SPECIAL.map((s) => (
                <td key={s.label} className="px-4 py-3 text-center">
                  <label className="flex items-center justify-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
                    <input type="checkbox" checked={(mode & s.bit) !== 0} onChange={() => toggle(s.bit)} className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                    {s.label}
                  </label>
                </td>
              ))}
              <td className="px-4 py-3 text-center font-mono text-slate-600">{(mode >> 9) & 7}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Octal</div>
          <input
            value={octalInput ?? octal(mode)}
            onChange={(e) => onOctal(e.target.value)}
            onBlur={() => setOctalInput(null)}
            maxLength={4}
            className={`w-full px-3 py-2 border rounded-lg font-mono text-xl tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/20 ${octalInput !== null && !/^[0-7]{3,4}$/.test(octalInput) ? 'border-red-300' : 'border-slate-200 focus:border-indigo-500'}`}
          />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Symbolic</div>
          <div className="flex items-center justify-between">
            <code className="font-mono text-xl tracking-widest text-slate-800">-{sym}</code>
            {copyBtn(sym, 'chmod-sym')}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl p-4 flex items-center gap-3 border border-slate-800">
        <span className="text-slate-500 font-mono">$</span>
        <code className="flex-1 font-mono text-sm text-blue-300/90">chmod {octal(mode)}</code>
        <input value={path} onChange={(e) => setPath(e.target.value)} className="w-48 px-3 py-1 rounded-md bg-slate-800 text-slate-200 font-mono text-sm outline-none border border-slate-700 focus:border-indigo-400" placeholder="path" />
        <button onClick={() => onCopy(command, 'chmod-cmd')} className={`p-1.5 rounded-lg ${copyStatus === 'chmod-cmd' ? 'text-green-400' : 'text-slate-400 hover:text-white'}`}>
          {copyStatus === 'chmod-cmd' ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.mode} onClick={() => { setOctalInput(null); setMode(p.mode); }} className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${mode === p.mode ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`} title={p.note}>
            <span className="font-mono font-semibold">{octal(p.mode)}</span> <span className="text-slate-400">{p.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChmodCalculator;
