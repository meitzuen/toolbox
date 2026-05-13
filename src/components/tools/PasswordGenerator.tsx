import React, { useState } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';

interface PasswordGeneratorProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onCopy, copyStatus }) => {
  const [pass, setPass] = useState('');
  const [length, setLength] = useState(16);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);

  const gen = () => {
    let charset = '';
    if (useLower)   charset += 'abcdefghijklmnopqrstuvwxyz';
    if (useUpper)   charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useNumbers) charset += '0123456789';
    if (useSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!charset) return;
    setPass(
      Array.from(crypto.getRandomValues(new Uint32Array(length)))
        .map(x => charset[x % charset.length])
        .join('')
    );
  };

  const getStrength = () => {
    let score = 0;
    if (useLower)   score++;
    if (useUpper)   score++;
    if (useNumbers) score++;
    if (useSymbols) score++;
    if (length >= 20) score++;
    if (length >= 32) score++;
    if (score <= 2) return { label: 'Weak',   color: 'text-red-600',   bar: 'bg-red-400',   w: 'w-1/4' };
    if (score <= 3) return { label: 'Fair',   color: 'text-amber-600', bar: 'bg-amber-400', w: 'w-2/4' };
    if (score <= 4) return { label: 'Good',   color: 'text-blue-600',  bar: 'bg-blue-400',  w: 'w-3/4' };
    return             { label: 'Strong', color: 'text-green-600', bar: 'bg-green-400', w: 'w-full' };
  };

  const s = getStrength();

  const options = [
    { label: 'Lowercase (a-z)',   value: useLower,   set: setUseLower },
    { label: 'Uppercase (A-Z)',   value: useUpper,   set: setUseUpper },
    { label: 'Numbers (0-9)',     value: useNumbers, set: setUseNumbers },
    { label: 'Symbols (!@#...)', value: useSymbols, set: setUseSymbols },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">Secure Password Generator</h2>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">Length</label>
            <span className="text-2xl font-bold font-mono text-indigo-600">{length}</span>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={e => setLength(+e.target.value)}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>8</span><span>16</span><span>32</span><span>48</span><span>64</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {options.map(({ label, value, set }) => (
            <label
              key={label}
              className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-200 transition-colors select-none"
            >
              <input
                type="checkbox"
                checked={value}
                onChange={e => set(e.target.checked)}
                className="accent-indigo-600 w-4 h-4"
              />
              <span className="text-sm text-slate-600">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={gen}
        disabled={!useLower && !useUpper && !useNumbers && !useSymbols}
        className="w-full bg-indigo-600 text-white py-3 px-8 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <RefreshCw size={18} /> Generate Password
      </button>

      {pass && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="font-mono text-base text-slate-800 break-all leading-relaxed p-3 bg-slate-50 rounded-lg border border-slate-100">
            {pass}
          </div>
          <div className="space-y-2">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${s.bar} ${s.w}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Strength: <span className={`font-semibold ${s.color}`}>{s.label}</span>
                <span className="text-slate-400 ml-2 font-mono">({length} chars)</span>
              </span>
              <button
                onClick={() => onCopy(pass, 'pass')}
                className={`flex items-center gap-2 text-sm font-bold transition-all ${
                  copyStatus === 'pass' ? 'text-green-600' : 'text-indigo-600 hover:underline'
                }`}
              >
                {copyStatus === 'pass' ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordGenerator;
