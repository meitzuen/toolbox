import React, { useMemo, useState } from 'react';

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const ZONES = [
  'UTC', 'Asia/Taipei', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Kolkata', 'Asia/Dubai',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo',
  'Australia/Sydney', 'Pacific/Auckland',
];
const ALL_ZONES = ZONES.includes(LOCAL_TZ) ? ZONES : [LOCAL_TZ, ...ZONES];

const pad = (n: number) => String(n).padStart(2, '0');
const toInputValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function wallParts(instant: number, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { y: get('year'), mo: get('month'), d: get('day'), h: get('hour'), mi: get('minute'), s: get('second') };
}

/** Offset (ms) of `tz` relative to UTC at the given instant. */
function tzOffset(instant: number, tz: string): number {
  const w = wallParts(instant, tz);
  return Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s) - Math.floor(instant / 1000) * 1000;
}

/** Interpret a `YYYY-MM-DDTHH:mm` wall-clock string in `tz` and return the UTC instant. */
function zonedToInstant(value: string, tz: string): number | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let guess = asUtc - tzOffset(asUtc, tz);
  guess = asUtc - tzOffset(guess, tz);
  return guess;
}

function formatIn(instant: number, tz: string) {
  const w = wallParts(instant, tz);
  const off = tzOffset(instant, tz) / 60000;
  const sign = off < 0 ? '-' : '+';
  return {
    text: `${w.y}-${pad(w.mo)}-${pad(w.d)} ${pad(w.h)}:${pad(w.mi)}`,
    offset: `UTC${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`,
  };
}

function breakdown(a: Date, b: Date) {
  const [from, to] = a <= b ? [a, b] : [b, a];
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  let ms = to.getTime() - from.getTime() - (new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime() - new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime());
  if (ms < 0) { days--; ms += 86400000; }
  if (days < 0) { months--; days += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  return { years, months, days, hours: Math.floor(ms / 3600000), minutes: Math.floor((ms % 3600000) / 60000) };
}

type Unit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

function addToDate(base: Date, amount: number, unit: Unit): Date {
  const d = new Date(base);
  switch (unit) {
    case 'minutes': d.setMinutes(d.getMinutes() + amount); break;
    case 'hours': d.setHours(d.getHours() + amount); break;
    case 'days': d.setDate(d.getDate() + amount); break;
    case 'weeks': d.setDate(d.getDate() + amount * 7); break;
    case 'months': d.setMonth(d.getMonth() + amount); break;
    case 'years': d.setFullYear(d.getFullYear() + amount); break;
  }
  return d;
}

const input = 'px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white';
const card = 'bg-white border border-slate-200 rounded-xl p-5 space-y-4';
const heading = 'text-xs font-bold text-slate-400 uppercase tracking-wider';

const DateCalculator: React.FC = () => {
  const [now] = useState(() => new Date());

  // time zone converter
  const [source, setSource] = useState(toInputValue(now));
  const [sourceTz, setSourceTz] = useState(LOCAL_TZ);
  const [targets, setTargets] = useState<string[]>(() => ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'].filter((z) => ALL_ZONES.includes(z)));

  // difference
  const [from, setFrom] = useState(toInputValue(now));
  const [to, setTo] = useState(() => toInputValue(new Date(now.getTime() + 30 * 86400000)));

  // add / subtract
  const [base, setBase] = useState(toInputValue(now));
  const [amount, setAmount] = useState('30');
  const [unit, setUnit] = useState<Unit>('days');
  const [direction, setDirection] = useState<1 | -1>(1);

  const instant = useMemo(() => zonedToInstant(source, sourceTz), [source, sourceTz]);

  const diff = useMemo(() => {
    const a = new Date(from), b = new Date(to);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
    const totalMs = Math.abs(b.getTime() - a.getTime());
    return { ...breakdown(a, b), totalDays: totalMs / 86400000, totalHours: totalMs / 3600000, totalMinutes: totalMs / 60000, negative: b < a };
  }, [from, to]);

  const added = useMemo(() => {
    const b = new Date(base);
    const n = Number(amount);
    if (isNaN(b.getTime()) || amount.trim() === '' || isNaN(n)) return null;
    return addToDate(b, n * direction, unit);
  }, [base, amount, unit, direction]);

  const toggleTarget = (z: string) => setTargets((t) => (t.includes(z) ? t.filter((x) => x !== z) : [...t, z]));

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">Date Calculator</h2>

      <section className={card}>
        <h3 className={heading}>Time Zone Converter</h3>
        <div className="flex flex-wrap gap-3">
          <input type="datetime-local" value={source} onChange={(e) => setSource(e.target.value)} className={input} />
          <select value={sourceTz} onChange={(e) => setSourceTz(e.target.value)} className={input}>
            {ALL_ZONES.map((z) => <option key={z} value={z}>{z}{z === LOCAL_TZ ? ' (local)' : ''}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_ZONES.map((z) => (
            <button
              key={z}
              onClick={() => toggleTarget(z)}
              className={`px-2 py-1 rounded-md border text-[11px] transition-all ${
                targets.includes(z) ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'
              }`}
            >
              {z}
            </button>
          ))}
        </div>
        {instant !== null && targets.length > 0 && (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
            {targets.map((z) => {
              const f = formatIn(instant, z);
              return (
                <div key={z} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="text-slate-600">{z}</span>
                  <span className="font-mono text-slate-800">{f.text} <span className="text-slate-400 text-xs ml-2">{f.offset}</span></span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className={card}>
        <h3 className={heading}>Difference Between Dates</h3>
        <div className="flex flex-wrap items-center gap-3">
          <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
          <span className="text-slate-300">→</span>
          <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className={input} />
        </div>
        {diff && (
          <div className="space-y-2 text-sm">
            <div className="font-medium text-slate-800">
              {diff.negative && <span className="text-slate-400 font-normal">(end is before start) </span>}
              {diff.years}y {diff.months}mo {diff.days}d {diff.hours}h {diff.minutes}m
            </div>
            <div className="font-mono text-xs text-slate-500">
              ≈ {diff.totalDays.toLocaleString(undefined, { maximumFractionDigits: 2 })} days · {diff.totalHours.toLocaleString(undefined, { maximumFractionDigits: 2 })} hours · {Math.round(diff.totalMinutes).toLocaleString()} minutes
            </div>
          </div>
        )}
      </section>

      <section className={card}>
        <h3 className={heading}>Add / Subtract</h3>
        <div className="flex flex-wrap items-center gap-3">
          <input type="datetime-local" value={base} onChange={(e) => setBase(e.target.value)} className={input} />
          <select value={direction} onChange={(e) => setDirection(Number(e.target.value) as 1 | -1)} className={input}>
            <option value={1}>+ Add</option>
            <option value={-1}>− Subtract</option>
          </select>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${input} w-24`} />
          <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className={input}>
            {(['minutes', 'hours', 'days', 'weeks', 'months', 'years'] as Unit[]).map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        {added && (
          <div className="font-mono text-sm text-slate-800">
            {toInputValue(added).replace('T', ' ')} <span className="text-slate-400 text-xs ml-2">{added.toLocaleDateString(undefined, { weekday: 'long' })}</span>
          </div>
        )}
      </section>
    </div>
  );
};

export default DateCalculator;
