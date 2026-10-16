import React, { useMemo, useState } from 'react';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ALIASES: Record<string, string> = {
  '@yearly': '0 0 1 1 *', '@annually': '0 0 1 1 *', '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0', '@daily': '0 0 * * *', '@midnight': '0 0 * * *', '@hourly': '0 * * * *',
};

interface Field { name: string; min: number; max: number; names?: string[]; offset?: number }
const FIELDS: Field[] = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day of month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12, names: MONTHS, offset: 1 },
  { name: 'day of week', min: 0, max: 7, names: DAYS, offset: 0 },
];

interface Parsed { values: Set<number>; any: boolean; raw: string }

function parseField(raw: string, f: Field): Parsed {
  const values = new Set<number>();
  const num = (s: string): number => {
    const idx = f.names?.indexOf(s.toUpperCase()) ?? -1;
    const n = idx >= 0 ? idx + (f.offset ?? 0) : /^\d+$/.test(s) ? Number(s) : NaN;
    if (isNaN(n) || n < f.min || n > f.max) throw new Error(`Invalid value "${s}" in ${f.name} field`);
    return n;
  };
  for (const part of raw.split(',')) {
    const [range, stepStr] = part.split('/');
    const step = stepStr === undefined ? 1 : Number(stepStr);
    if (!Number.isInteger(step) || step < 1) throw new Error(`Invalid step "${stepStr}" in ${f.name} field`);
    let lo: number, hi: number;
    if (range === '*') { lo = f.min; hi = f.name === 'day of week' ? 6 : f.max; }
    else if (range.includes('-')) { const [a, b] = range.split('-'); lo = num(a); hi = num(b); if (lo > hi) throw new Error(`Reversed range "${range}" in ${f.name} field`); }
    else { lo = num(range); hi = stepStr === undefined ? lo : f.max; }
    for (let v = lo; v <= hi; v += step) values.add(f.name === 'day of week' && v === 7 ? 0 : v);
  }
  return { values, any: raw === '*' || raw === '*/1', raw };
}

function parseCron(expr: string): Parsed[] {
  const norm = ALIASES[expr.trim().toLowerCase()] ?? expr.trim();
  const parts = norm.split(/\s+/);
  if (parts.length !== 5) throw new Error('Expected 5 fields: minute hour day-of-month month day-of-week');
  return parts.map((p, i) => parseField(p, FIELDS[i]));
}

function nextRuns(p: Parsed[], count: number, from: Date): Date[] {
  const [min, hour, dom, mon, dow] = p;
  const out: Date[] = [];
  const day = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const minutes = [...min.values].sort((a, b) => a - b);
  const hours = [...hour.values].sort((a, b) => a - b);
  for (let i = 0; i < 366 * 5 && out.length < count; i++, day.setDate(day.getDate() + 1)) {
    if (!mon.values.has(day.getMonth() + 1)) continue;
    const domOk = dom.values.has(day.getDate());
    const dowOk = dow.values.has(day.getDay());
    const dayOk = !dom.any && !dow.any ? domOk || dowOk : domOk && dowOk;
    if (!dayOk) continue;
    for (const h of hours) for (const m of minutes) {
      const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
      if (d > from && out.length < count) out.push(d);
    }
  }
  return out;
}

const pad = (n: number) => String(n).padStart(2, '0');
const list = (xs: string[]) => (xs.length <= 2 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}`);

function describe(p: Parsed[]): string {
  const [min, hour, dom, mon, dow] = p;
  const sorted = (x: Parsed) => [...x.values].sort((a, b) => a - b);
  let time: string;
  if (min.raw === '*' && hour.raw === '*') time = 'Every minute';
  else if (/^\*\/\d+$/.test(min.raw) && hour.raw === '*') time = `Every ${min.raw.slice(2)} minutes`;
  else if (hour.raw === '*' && min.values.size === 1) time = min.values.has(0) ? 'Every hour, on the hour' : `Every hour at minute ${sorted(min)[0]}`;
  else if (hour.raw === '*') time = `At minutes ${list(sorted(min).map(String))} of every hour`;
  else if (/^\*\/\d+$/.test(hour.raw) && min.values.size === 1) time = `At minute ${sorted(min)[0]} past every ${hour.raw.slice(2)} hours`;
  else if (/^\*\/\d+$/.test(min.raw)) {
    const hs = sorted(hour);
    const contiguous = hs.every((h, i) => i === 0 || h === hs[i - 1] + 1);
    time = `Every ${min.raw.slice(2)} minutes, ${contiguous && hs.length > 1 ? `between ${pad(hs[0])}:00 and ${pad(hs[hs.length - 1])}:59` : `during hour ${list(hs.map(String))}`}`;
  } else {
    const times = sorted(hour).flatMap((h) => sorted(min).map((m) => `${pad(h)}:${pad(m)}`));
    time = `At ${times.length > 6 ? `${times.length} times a day (${times[0]}…${times[times.length - 1]})` : list(times)}`;
  }
  const bits: string[] = [];
  if (!dom.any && !dow.any) {
    bits.push(`on day ${list(sorted(dom).map(String))} of the month, or on ${list(sorted(dow).map((d) => DAY_NAMES[d]))}`);
  } else {
    if (!dom.any) bits.push(`on day ${list(sorted(dom).map(String))} of the month`);
    if (!dow.any) bits.push(`on ${list(sorted(dow).map((d) => DAY_NAMES[d]))}`);
  }
  if (!mon.any) bits.push(`in ${list(sorted(mon).map((m) => MONTH_NAMES[m - 1]))}`);
  return [time, ...bits].join(', ');
}

const EXAMPLES = [
  { expr: '*/15 * * * *', label: 'Every 15 min' },
  { expr: '0 9 * * 1-5', label: 'Weekdays 09:00' },
  { expr: '30 2 1 * *', label: 'Monthly, 02:30' },
  { expr: '0 0 * * SUN', label: 'Sundays midnight' },
  { expr: '@hourly', label: '@hourly' },
];

const CronParser: React.FC = () => {
  const [expr, setExpr] = useState('*/15 9-17 * * 1-5');
  const [count, setCount] = useState(10);

  const result = useMemo(() => {
    if (!expr.trim()) return null;
    try {
      const parsed = parseCron(expr);
      return { description: describe(parsed), runs: nextRuns(parsed, count, new Date()), parsed };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Invalid cron expression' };
    }
  }, [expr, count]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">Cron Parser</h2>

      <input
        value={expr}
        onChange={(e) => setExpr(e.target.value)}
        className="w-full p-4 border border-slate-200 rounded-xl font-mono text-lg tracking-wide focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
        placeholder="* * * * *"
        spellCheck={false}
      />

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button key={ex.expr} onClick={() => setExpr(ex.expr)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all" title={ex.expr}>
            {ex.label}
          </button>
        ))}
      </div>

      {result && 'error' in result && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{result.error}</div>
      )}

      {result && !('error' in result) && (
        <>
          <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 font-medium">{result.description}</div>

          <div className="grid grid-cols-5 gap-2 text-center">
            {FIELDS.map((f, i) => (
              <div key={f.name} className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="font-mono text-base text-slate-800">{result.parsed[i].raw}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">{f.name}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next runs (local time)</span>
              <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white">
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {result.runs.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">No run found in the next 5 years.</div>
            ) : (
              <ol className="divide-y divide-slate-50 font-mono text-sm">
                {result.runs.map((d, i) => (
                  <li key={i} className="px-4 py-2 flex justify-between text-slate-700">
                    <span>{d.getFullYear()}-{pad(d.getMonth() + 1)}-{pad(d.getDate())} {pad(d.getHours())}:{pad(d.getMinutes())}</span>
                    <span className="text-slate-400">{DAY_NAMES[d.getDay()]}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CronParser;
