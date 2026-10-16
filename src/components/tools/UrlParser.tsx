import React, { useMemo, useState } from 'react';
import { Check, Copy, Plus, X } from 'lucide-react';

interface UrlParserProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const UrlParser: React.FC<UrlParserProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState('https://user:pass@example.com:8080/api/v1/search?q=hello%20world&tag=a&tag=b#results');

  const url = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return new URL(input.trim());
    } catch {
      return undefined;
    }
  }, [input]);

  const params = url ? [...url.searchParams] : [];

  const update = (mutate: (u: URL) => void) => {
    if (!url) return;
    const next = new URL(url.href);
    mutate(next);
    setInput(next.href);
  };

  const setParams = (list: [string, string][]) =>
    update((u) => {
      u.search = '';
      list.forEach(([k, v]) => u.searchParams.append(k, v));
    });

  const parts: { label: string; value: string }[] = url ? [
    { label: 'Protocol', value: url.protocol.replace(':', '') },
    { label: 'Username', value: decodeURIComponent(url.username) },
    { label: 'Password', value: decodeURIComponent(url.password) },
    { label: 'Hostname', value: url.hostname },
    { label: 'Port', value: url.port },
    { label: 'Path', value: url.pathname },
    { label: 'Hash', value: url.hash.replace('#', '') },
    { label: 'Origin', value: url.origin },
  ] : [];

  const cell = 'w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white';

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">URL Parser</h2>

      <div className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-3 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
          placeholder="https://example.com/path?key=value"
          spellCheck={false}
        />
        <button
          onClick={() => url && onCopy(url.href, 'url-parser')}
          disabled={!url}
          className="px-4 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 transition-all"
          title="Copy URL"
        >
          {copyStatus === 'url-parser' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
        </button>
      </div>

      {url === undefined && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">Invalid URL — include a protocol, e.g. https://</div>
      )}

      {url && (
        <>
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {parts.map((p) => (
              <div key={p.label} className="flex px-4 py-2.5 gap-4 text-sm">
                <span className="w-24 shrink-0 text-xs font-bold text-slate-400 uppercase tracking-wider leading-5">{p.label}</span>
                <span className="font-mono text-slate-700 break-all">{p.value || <span className="text-slate-300">—</span>}</span>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Query Parameters ({params.length})</span>
              <button
                onClick={() => setParams([...params, ['', '']])}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {params.length === 0 && <div className="text-sm text-slate-300 italic">No query parameters</div>}
            {params.map(([k, v], i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className={cell} value={k} placeholder="key" onChange={(e) => setParams(params.map((p, j) => (j === i ? [e.target.value, p[1]] : p)))} />
                <span className="text-slate-300">=</span>
                <input className={cell} value={v} placeholder="value" onChange={(e) => setParams(params.map((p, j) => (j === i ? [p[0], e.target.value] : p)))} />
                <button onClick={() => setParams(params.filter((_, j) => j !== i))} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors" title="Remove">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UrlParser;
