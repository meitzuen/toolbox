import React, { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';

interface NumberBaseConverterProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const BASES = [
  { id: 'bin', label: 'Binary',       base: 2,  prefix: '0b', placeholder: '1010' },
  { id: 'oct', label: 'Octal',        base: 8,  prefix: '0o', placeholder: '12'   },
  { id: 'dec', label: 'Decimal',      base: 10, prefix: '',   placeholder: '10'   },
  { id: 'hex', label: 'Hexadecimal',  base: 16, prefix: '0x', placeholder: 'A'    },
] as const;

const NumberBaseConverter: React.FC<NumberBaseConverterProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState('');
  const [fromBase, setFromBase] = useState<number>(10);

  const decimal = useMemo(() => {
    const raw = input.trim();
    if (!raw) return null;
    const val = parseInt(raw, fromBase);
    return isNaN(val) ? null : val;
  }, [input, fromBase]);

  const conversions = useMemo(() => {
    if (decimal === null) return null;
    return BASES.map(b => ({
      ...b,
      value: decimal.toString(b.base).toUpperCase(),
    }));
  }, [decimal]);

  const currentBase = BASES.find(b => b.base === fromBase)!;
  const isInvalid = input.trim().length > 0 && decimal === null;

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">Number Base Converter</h2>

      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Input — select the base of your number
        </label>
        <div className="flex gap-3 flex-wrap">
          <input
            className={`flex-1 min-w-0 p-4 border rounded-xl font-mono text-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all ${
              isInvalid ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
            }`}
            placeholder={`Enter ${currentBase.label.toLowerCase()} number (e.g. ${currentBase.placeholder})`}
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            {BASES.map(b => (
              <button
                key={b.id}
                onClick={() => { setFromBase(b.base); setInput(''); }}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  fromBase === b.base
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {b.label.slice(0, 3).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {isInvalid && (
          <p className="text-rose-500 text-xs font-medium">
            Invalid {currentBase.label.toLowerCase()} number
          </p>
        )}
      </div>

      <div className="space-y-3">
        {(conversions ?? BASES.map(b => ({ ...b, value: '' }))).map(({ id, label, base, prefix, value }) => {
          const isSource = base === fromBase;
          const copyId = `base-${id}` as const;
          return (
            <div
              key={id}
              className={`rounded-xl px-5 py-4 flex items-center justify-between gap-4 border transition-colors ${
                isSource
                  ? 'border-indigo-300 bg-indigo-50/40'
                  : 'border-slate-200 bg-white hover:border-indigo-200'
              }`}
            >
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {label} — Base {base}
                  {isSource && <span className="ml-2 text-indigo-400">(input)</span>}
                </div>
                <div className="font-mono text-base text-slate-800 mt-1 break-all">
                  {prefix && <span className="text-slate-400 text-sm mr-0.5">{prefix}</span>}
                  {value || <span className="text-slate-300 italic text-sm">—</span>}
                </div>
              </div>
              <button
                onClick={() => value && onCopy(value, copyId)}
                disabled={!value}
                className={`shrink-0 p-1.5 rounded-lg transition-all ${
                  copyStatus === copyId
                    ? 'text-green-500'
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30'
                }`}
              >
                {copyStatus === copyId ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NumberBaseConverter;
