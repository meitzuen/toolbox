import React, { useMemo, useState } from 'react';
import { FileUp } from 'lucide-react';

interface PmItem {
  name?: string;
  item?: PmItem[];
  request?: {
    method?: string;
    url?: string | { raw?: string };
    header?: { key: string; value: string; disabled?: boolean }[];
    body?: { mode?: string; raw?: string; urlencoded?: unknown; formdata?: unknown; graphql?: unknown };
  };
  event?: { listen: string; script?: { exec?: string[] | string } }[];
}

interface Flat { path: string; fields: Record<string, string> }

const execText = (e: string[] | string | undefined) => (Array.isArray(e) ? e.join('\n') : e ?? '');

function describe(item: PmItem): Record<string, string> {
  const r = item.request;
  const url = typeof r?.url === 'string' ? r.url : r?.url?.raw ?? '';
  const b = r?.body;
  const body = !b ? '' : b.mode === 'raw' ? b.raw ?? '' : JSON.stringify(b[b.mode as 'urlencoded' | 'formdata' | 'graphql'] ?? b, null, 2);
  const fields: Record<string, string> = {
    Method: r?.method ?? '',
    URL: url,
    Headers: (r?.header ?? []).map((h) => `${h.disabled ? '// ' : ''}${h.key}: ${h.value}`).join('\n'),
    Body: body,
  };
  for (const ev of item.event ?? []) {
    const label = ev.listen === 'prerequest' ? 'Pre-request script' : ev.listen === 'test' ? 'Test script' : `${ev.listen} script`;
    fields[label] = execText(ev.script?.exec);
  }
  return fields;
}

function flatten(items: PmItem[], prefix: string[], out: Flat[], seen: Map<string, number>) {
  for (const it of items) {
    const name = it.name ?? '(unnamed)';
    if (it.item) { flatten(it.item, [...prefix, name], out, seen); continue; }
    const base = [...prefix, name].join(' / ');
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    out.push({ path: n > 1 ? `${base} (#${n})` : base, fields: describe(it) });
  }
}

function load(text: string): Flat[] {
  const json = JSON.parse(text);
  if (!json || !Array.isArray(json.item)) throw new Error('Not a Postman collection (missing "item" array)');
  const out: Flat[] = [];
  flatten(json.item, [], out, new Map());
  return out;
}

interface Modified { path: string; changes: { field: string; before: string; after: string }[] }

function compare(a: Flat[], b: Flat[], ignoreWs: boolean) {
  const norm = (s: string) => (ignoreWs ? s.replace(/\s+/g, ' ').trim() : s);
  const am = new Map(a.map((x) => [x.path, x]));
  const bm = new Map(b.map((x) => [x.path, x]));
  const added = b.filter((x) => !am.has(x.path)).map((x) => x.path);
  const removed = a.filter((x) => !bm.has(x.path)).map((x) => x.path);
  const modified: Modified[] = [];
  let unchanged = 0;
  for (const x of a) {
    const y = bm.get(x.path);
    if (!y) continue;
    const fields = [...new Set([...Object.keys(x.fields), ...Object.keys(y.fields)])];
    const changes = fields
      .filter((f) => norm(x.fields[f] ?? '') !== norm(y.fields[f] ?? ''))
      .map((f) => ({ field: f, before: x.fields[f] ?? '', after: y.fields[f] ?? '' }));
    if (changes.length) modified.push({ path: x.path, changes }); else unchanged++;
  }
  return { added, removed, modified, unchanged };
}

const Side: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
      <label className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium">
        <FileUp size={13} /> Load file
        <input type="file" accept=".json,application/json" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) onChange(await f.text()); e.target.value = ''; }} />
      </label>
    </div>
    <textarea
      className="w-full h-48 p-4 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
      placeholder="Paste Postman collection JSON..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
    />
  </div>
);

const PostmanCollectionDiff: React.FC = () => {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [ignoreWs, setIgnoreWs] = useState(true);

  const result = useMemo(() => {
    if (!left.trim() || !right.trim()) return null;
    try {
      return { ...compare(load(left), load(right), ignoreWs), error: '' };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Invalid JSON' };
    }
  }, [left, right, ignoreWs]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">Postman Collection Diff</h2>
      <p className="text-slate-500 text-sm">Compares two collections request by request (matched by folder path + name): methods, URLs, headers, bodies and scripts.</p>

      <div className="grid grid-cols-2 gap-4">
        <Side label="Old collection" value={left} onChange={setLeft} />
        <Side label="New collection" value={right} onChange={setRight} />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none w-fit">
        <input type="checkbox" checked={ignoreWs} onChange={(e) => setIgnoreWs(e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
        Ignore whitespace differences
      </label>

      {result?.error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{result.error}</div>}

      {result && !result.error && 'added' in result && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ['Added', result.added.length, 'text-emerald-600'],
              ['Removed', result.removed.length, 'text-red-500'],
              ['Modified', result.modified.length, 'text-amber-600'],
              ['Unchanged', result.unchanged, 'text-slate-500'],
            ].map(([label, n, color]) => (
              <div key={label as string} className="bg-white border border-slate-200 rounded-lg py-3">
                <div className={`font-mono text-2xl ${color}`}>{n}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
              </div>
            ))}
          </div>

          {result.added.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-emerald-50 text-xs font-bold text-emerald-700 uppercase tracking-wider">Added requests</div>
              <ul className="divide-y divide-slate-100 font-mono text-xs">{result.added.map((p) => <li key={p} className="px-4 py-2 text-slate-700">+ {p}</li>)}</ul>
            </div>
          )}
          {result.removed.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-red-50 text-xs font-bold text-red-600 uppercase tracking-wider">Removed requests</div>
              <ul className="divide-y divide-slate-100 font-mono text-xs">{result.removed.map((p) => <li key={p} className="px-4 py-2 text-slate-700">− {p}</li>)}</ul>
            </div>
          )}
          {result.modified.map((m) => (
            <details key={m.path} className="bg-white border border-slate-200 rounded-xl overflow-hidden" open={result.modified.length <= 5}>
              <summary className="px-4 py-2.5 bg-amber-50 cursor-pointer text-sm font-mono text-slate-800 flex items-center justify-between">
                <span className="break-all">{m.path}</span>
                <span className="text-[11px] text-amber-700 shrink-0 ml-3">{m.changes.map((c) => c.field).join(', ')}</span>
              </summary>
              <div className="divide-y divide-slate-100">
                {m.changes.map((c) => (
                  <div key={c.field} className="p-4 space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{c.field}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <pre className="p-3 rounded-lg bg-red-50 text-xs font-mono whitespace-pre-wrap break-all text-slate-700 max-h-64 overflow-auto">{c.before || <span className="text-slate-300 italic">(empty)</span>}</pre>
                      <pre className="p-3 rounded-lg bg-emerald-50 text-xs font-mono whitespace-pre-wrap break-all text-slate-700 max-h-64 overflow-auto">{c.after || <span className="text-slate-300 italic">(empty)</span>}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
          {!result.added.length && !result.removed.length && !result.modified.length && (
            <div className="p-6 text-center text-sm text-slate-400 bg-white border border-slate-200 rounded-xl">The collections are identical.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostmanCollectionDiff;
