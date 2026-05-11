import React, { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';

const TimestampTool: React.FC = () => {
  const [ts, setTs] = useState<string>(Math.floor(Date.now() / 1000).toString());
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const info = useMemo(() => {
    const raw = ts.trim();
    if (!raw) return null;
    const val = parseInt(raw);
    if (isNaN(val)) return { error: 'Invalid timestamp' };
    const ms = raw.length >= 13 ? val : val * 1000;
    const date = new Date(ms);
    if (isNaN(date.getTime())) return { error: 'Invalid timestamp' };

    const diffMs = Date.now() - ms;
    const abs = Math.abs(diffMs);
    const future = diffMs < 0;
    let relative: string;
    if (abs < 5000)        relative = 'just now';
    else if (abs < 60000)  relative = `${Math.round(abs / 1000)}s ${future ? 'from now' : 'ago'}`;
    else if (abs < 3600000) relative = `${Math.round(abs / 60000)}m ${future ? 'from now' : 'ago'}`;
    else if (abs < 86400000) relative = `${Math.round(abs / 3600000)}h ${future ? 'from now' : 'ago'}`;
    else                   relative = `${Math.round(abs / 86400000)}d ${future ? 'from now' : 'ago'}`;

    return {
      local: date.toLocaleString(),
      utc: date.toUTCString(),
      iso: date.toISOString(),
      relative,
      unix: Math.floor(ms / 1000).toString(),
      unixMs: ms.toString(),
    };
  }, [ts]);

  const rows = info && !('error' in info) ? [
    { id: 'utc',     label: 'UTC',              value: info.utc },
    { id: 'iso',     label: 'ISO 8601',          value: info.iso },
    { id: 'unix',    label: 'Unix (seconds)',    value: info.unix },
    { id: 'unix-ms', label: 'Unix (milliseconds)', value: info.unixMs },
  ] : [];

  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-2xl font-bold">Timestamp Converter</h2>

      <div className="flex gap-3">
        <input
          type="text"
          value={ts}
          onChange={e => setTs(e.target.value)}
          className="flex-1 p-3 border rounded-lg font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          placeholder="Unix timestamp — seconds or milliseconds"
        />
        <button
          onClick={() => setTs(Math.floor(Date.now() / 1000).toString())}
          className="px-5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
        >
          Now
        </button>
      </div>

      {info && 'error' in info && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{info.error}</div>
      )}

      {info && !('error' in info) && (
        <div className="space-y-3">
          <div className="p-6 bg-indigo-600 rounded-2xl text-center shadow-xl shadow-indigo-100">
            <div className="text-indigo-200 text-xs uppercase tracking-[0.2em] font-bold">Local Time</div>
            <div className="text-2xl font-mono mt-2 text-white">{info.local}</div>
            <div className="text-indigo-300 text-sm mt-1">{info.relative}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rows.map(({ id, label, value }) => (
              <div
                key={id}
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 hover:border-indigo-200 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
                  <div className="font-mono text-sm text-slate-700 mt-0.5 truncate">{value}</div>
                </div>
                <button
                  onClick={() => handleCopy(value, id)}
                  className={`shrink-0 p-1.5 rounded-lg transition-all ${
                    copyStatus === id
                      ? 'text-green-500'
                      : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  {copyStatus === id ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimestampTool;
