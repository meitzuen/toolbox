import React, { useMemo, useState } from 'react';

type Op<T> = { type: 'eq' | 'del' | 'add'; value: T };

const MAX_CELLS = 9_000_000;

function diffSeq<T>(a: T[], b: T[], same: (x: T, y: T) => boolean): Op<T>[] | null {
  const n = a.length, m = b.length;
  if ((n + 1) * (m + 1) > MAX_CELLS) return null;
  const w = m + 1;
  const dp = new Uint32Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * w + j] = same(a[i], b[j]) ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
    }
  }
  const ops: Op<T>[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (same(a[i], b[j])) { ops.push({ type: 'eq', value: b[j] }); i++; j++; }
    else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) ops.push({ type: 'del', value: a[i++] });
    else ops.push({ type: 'add', value: b[j++] });
  }
  while (i < n) ops.push({ type: 'del', value: a[i++] });
  while (j < m) ops.push({ type: 'add', value: b[j++] });
  return ops;
}

interface Row {
  type: 'eq' | 'del' | 'add';
  left?: number;
  right?: number;
  parts: { text: string; changed: boolean }[];
}

const tokenize = (s: string) => s.match(/\s+|\w+|[^\w\s]/g) ?? [];

function build(a: string, b: string, ignoreCase: boolean, ignoreWs: boolean): { rows: Row[]; added: number; removed: number } | null {
  const norm = (s: string) => {
    let r = s;
    if (ignoreWs) r = r.trim().replace(/\s+/g, ' ');
    return ignoreCase ? r.toLowerCase() : r;
  };
  const la = a === '' ? [] : a.split(/\r?\n/);
  const lb = b === '' ? [] : b.split(/\r?\n/);
  const ops = diffSeq(la, lb, (x, y) => norm(x) === norm(y));
  if (!ops) return null;

  const rows: Row[] = [];
  let l = 1, r = 1, added = 0, removed = 0;
  for (let k = 0; k < ops.length;) {
    if (ops[k].type === 'eq') {
      rows.push({ type: 'eq', left: l++, right: r++, parts: [{ text: ops[k].value, changed: false }] });
      k++;
      continue;
    }
    const dels: string[] = [], adds: string[] = [];
    while (k < ops.length && ops[k].type !== 'eq') {
      (ops[k].type === 'del' ? dels : adds).push(ops[k].value);
      k++;
    }
    removed += dels.length;
    added += adds.length;
    const pairs = Math.min(dels.length, adds.length);
    const delRows: Row[] = dels.map((text, i) => ({ type: 'del', left: l + i, parts: [{ text, changed: false }] }));
    const addRows: Row[] = adds.map((text, i) => ({ type: 'add', right: r + i, parts: [{ text, changed: false }] }));
    for (let i = 0; i < pairs; i++) {
      const wd = diffSeq(tokenize(dels[i]), tokenize(adds[i]), (x, y) => x === y);
      if (!wd) continue;
      delRows[i].parts = wd.filter((o) => o.type !== 'add').map((o) => ({ text: o.value, changed: o.type === 'del' }));
      addRows[i].parts = wd.filter((o) => o.type !== 'del').map((o) => ({ text: o.value, changed: o.type === 'add' }));
    }
    rows.push(...delRows, ...addRows);
    l += dels.length;
    r += adds.length;
  }
  return { rows, added, removed };
}

const STYLE = {
  eq: { row: '', mark: '', sign: ' ' },
  del: { row: 'bg-red-50', mark: 'bg-red-200 rounded-sm', sign: '-' },
  add: { row: 'bg-emerald-50', mark: 'bg-emerald-200 rounded-sm', sign: '+' },
} as const;

const TextDiff: React.FC = () => {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWs, setIgnoreWs] = useState(false);
  const [onlyChanges, setOnlyChanges] = useState(false);

  const result = useMemo(() => build(a, b, ignoreCase, ignoreWs), [a, b, ignoreCase, ignoreWs]);
  const hasInput = a !== '' || b !== '';
  const visible = result ? (onlyChanges ? result.rows.filter((r) => r.type !== 'eq') : result.rows) : [];

  const area = 'w-full h-56 p-4 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white';
  const check = 'flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none';

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">Text Diff</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Original</label>
          <textarea className={area} value={a} onChange={(e) => setA(e.target.value)} placeholder="Original text..." />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modified</label>
          <textarea className={area} value={b} onChange={(e) => setB(e.target.value)} placeholder="Modified text..." />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <label className={check}><input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} className="rounded border-slate-300 text-indigo-600" />Ignore case</label>
        <label className={check}><input type="checkbox" checked={ignoreWs} onChange={(e) => setIgnoreWs(e.target.checked)} className="rounded border-slate-300 text-indigo-600" />Ignore whitespace</label>
        <label className={check}><input type="checkbox" checked={onlyChanges} onChange={(e) => setOnlyChanges(e.target.checked)} className="rounded border-slate-300 text-indigo-600" />Only show changes</label>
        {result && hasInput && (
          <span className="ml-auto text-xs font-mono">
            <span className="text-emerald-600">+{result.added}</span>{' '}
            <span className="text-red-500">−{result.removed}</span>
          </span>
        )}
      </div>

      {hasInput && !result && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">Inputs are too large to diff in the browser. Try fewer lines.</div>
      )}

      {result && hasInput && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {visible.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">{result.rows.length ? 'No differences.' : ''}</div>
          ) : (
            <div className="max-h-[480px] overflow-auto font-mono text-sm">
              {visible.map((row, i) => {
                const s = STYLE[row.type];
                return (
                  <div key={i} className={`flex ${s.row}`}>
                    <span className="w-10 shrink-0 text-right pr-2 text-slate-400 select-none text-xs leading-6">{row.left ?? ''}</span>
                    <span className="w-10 shrink-0 text-right pr-2 text-slate-400 select-none text-xs leading-6">{row.right ?? ''}</span>
                    <span className="w-5 shrink-0 text-center text-slate-400 select-none leading-6">{s.sign}</span>
                    <span className="flex-1 whitespace-pre-wrap break-all leading-6 pr-3">
                      {row.parts.map((p, j) => (p.changed ? <mark key={j} className={`${s.mark} text-inherit`}>{p.text}</mark> : <span key={j}>{p.text}</span>))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TextDiff;
