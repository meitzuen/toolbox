import React, { useState, useMemo } from 'react';

const RegexValidator: React.FC = () => {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('');

  const result = useMemo(() => {
    if (!pattern) return { status: 'waiting' as const };
    try {
      new RegExp(pattern, flags); // validate first
      const matches = [...testString.matchAll(new RegExp(pattern, flags.includes('g') ? flags : flags + 'g'))];
      return {
        status: matches.length > 0 ? ('match' as const) : ('no-match' as const),
        matches,
        count: matches.length,
      };
    } catch {
      return { status: 'error' as const };
    }
  }, [pattern, flags, testString]);

  const highlighted = useMemo(() => {
    if (result.status !== 'match' || !testString || !pattern) return null;
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
      const parts: { text: string; highlight: boolean }[] = [];
      let lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(testString)) !== null) {
        if (m.index > lastIndex) parts.push({ text: testString.slice(lastIndex, m.index), highlight: false });
        parts.push({ text: m[0], highlight: true });
        lastIndex = m.index + m[0].length;
        if (m[0].length === 0) { re.lastIndex++; }
      }
      if (lastIndex < testString.length) parts.push({ text: testString.slice(lastIndex), highlight: false });
      return parts;
    } catch {
      return null;
    }
  }, [pattern, flags, testString, result.status]);

  const statusConfig = {
    match:    { bg: 'bg-green-100',  text: 'text-green-700',  label: `MATCHED — ${result.count ?? 0} occurrence${result.count !== 1 ? 's' : ''}` },
    'no-match': { bg: 'bg-red-100', text: 'text-red-700',    label: 'NO MATCH' },
    error:    { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'INVALID REGEX' },
    waiting:  { bg: 'bg-slate-100',  text: 'text-slate-400',  label: 'WAITING FOR INPUT' },
  };

  const cfg = statusConfig[result.status];

  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-2xl font-bold">Regex Validator</h2>

      <div className="flex gap-3 items-stretch">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm select-none">/</span>
          <input
            className="w-full pl-6 pr-6 py-3 border rounded-lg font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            placeholder="pattern"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm select-none">/</span>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-lg gap-0.5 border border-slate-200">
          {['g', 'i', 'm', 's'].map(f => (
            <button
              key={f}
              title={{ g: 'Global', i: 'Case insensitive', m: 'Multiline', s: 'Dot matches newline' }[f]}
              onClick={() =>
                setFlags(prev =>
                  prev.includes(f) ? prev.replace(f, '') : prev + f
                )
              }
              className={`w-7 h-7 rounded-md font-mono text-xs font-bold transition-all ${
                flags.includes(f)
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <textarea
        className="w-full h-32 p-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
        placeholder="Enter test string..."
        value={testString}
        onChange={e => setTestString(e.target.value)}
      />

      <div className={`p-4 rounded-lg font-bold text-center transition-colors ${cfg.bg} ${cfg.text}`}>
        {cfg.label}
      </div>

      {highlighted && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matches highlighted</label>
          <div className="p-4 bg-white border border-slate-200 rounded-xl font-mono text-sm leading-relaxed break-words whitespace-pre-wrap">
            {highlighted.map((part, i) =>
              part.highlight ? (
                <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5 not-italic">
                  {part.text}
                </mark>
              ) : (
                <span key={i}>{part.text}</span>
              )
            )}
          </div>
        </div>
      )}

      {result.status === 'match' && result.matches && result.matches.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Match list ({result.matches.length})
          </label>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {result.matches.map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono">
                <span className="text-slate-400 w-5 shrink-0 text-right">{i + 1}</span>
                <span className="text-indigo-600 font-semibold">{JSON.stringify(m[0])}</span>
                <span className="text-slate-400 ml-auto">@{m.index}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegexValidator;
