import React, { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface JsonToTypesProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

type Shape =
  | { k: 'prim'; name: 'string' | 'number' | 'boolean' | 'null' }
  | { k: 'obj'; props: Map<string, { t: Shape; opt: boolean }> }
  | { k: 'arr'; item: Shape | null }
  | { k: 'union'; items: Shape[] };

function infer(v: unknown): Shape {
  if (v === null) return { k: 'prim', name: 'null' };
  if (Array.isArray(v)) return { k: 'arr', item: v.map(infer).reduce<Shape | null>((a, b) => (a ? merge(a, b) : b), null) };
  if (typeof v === 'object') {
    const props = new Map<string, { t: Shape; opt: boolean }>();
    for (const [key, val] of Object.entries(v as object)) props.set(key, { t: infer(val), opt: false });
    return { k: 'obj', props };
  }
  if (typeof v === 'number') return { k: 'prim', name: 'number' };
  if (typeof v === 'boolean') return { k: 'prim', name: 'boolean' };
  return { k: 'prim', name: 'string' };
}

function merge(a: Shape, b: Shape): Shape {
  if (a.k === 'union') return b.k === 'union' ? b.items.reduce(merge, a) : addToUnion(a, b);
  if (b.k === 'union') return addToUnion(b, a);
  if (a.k === 'prim' && b.k === 'prim' && a.name === b.name) return a;
  if (a.k === 'arr' && b.k === 'arr') return { k: 'arr', item: a.item && b.item ? merge(a.item, b.item) : a.item ?? b.item };
  if (a.k === 'obj' && b.k === 'obj') {
    const props = new Map<string, { t: Shape; opt: boolean }>();
    for (const [key, p] of a.props) {
      const q = b.props.get(key);
      props.set(key, q ? { t: merge(p.t, q.t), opt: p.opt || q.opt } : { t: p.t, opt: true });
    }
    for (const [key, q] of b.props) if (!a.props.has(key)) props.set(key, { t: q.t, opt: true });
    return { k: 'obj', props };
  }
  return { k: 'union', items: [a, b] };
}

function addToUnion(u: Extract<Shape, { k: 'union' }>, s: Shape): Shape {
  const idx = u.items.findIndex((i) => i.k === s.k && (i.k !== 'prim' || (s.k === 'prim' && i.name === s.name)));
  if (idx < 0) return { k: 'union', items: [...u.items, s] };
  const items = [...u.items];
  items[idx] = merge(items[idx], s);
  return { k: 'union', items };
}

const pascal = (s: string) => s.replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^(.)/, (c) => c.toUpperCase()) || 'Item';
const singular = (s: string) => (s.endsWith('ies') ? s.slice(0, -3) + 'y' : s.endsWith('s') && s.length > 1 ? s.slice(0, -1) : s);
const safeKey = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));

function toTypeScript(root: Shape, rootName: string, useType: boolean): string {
  const decls: string[] = [];
  const used = new Set<string>();
  const unique = (n: string) => { let name = n, i = 2; while (used.has(name)) name = n + i++; used.add(name); return name; };

  const render = (s: Shape, hint: string): string => {
    switch (s.k) {
      case 'prim': return s.name;
      case 'arr': {
        if (!s.item) return 'unknown[]';
        const inner = render(s.item, singular(hint));
        return s.item.k === 'union' ? `(${inner})[]` : `${inner}[]`;
      }
      case 'union': return s.items.map((i) => render(i, hint)).join(' | ');
      case 'obj': {
        const name = unique(pascal(hint));
        const idx = decls.push('') - 1;
        const body = [...s.props].map(([k, p]) => `  ${safeKey(k)}${p.opt ? '?' : ''}: ${render(p.t, k)};`).join('\n');
        decls[idx] = useType ? `type ${name} = {\n${body}\n};` : `interface ${name} {\n${body}\n}`;
        return name;
      }
    }
  };

  const top = render(root, rootName);
  if (root.k !== 'obj') decls.push(`type ${unique(pascal(rootName))} = ${top};`);
  return decls.join('\n\n');
}

function toSchema(s: Shape): Record<string, unknown> {
  switch (s.k) {
    case 'prim': return { type: s.name };
    case 'arr': return s.item ? { type: 'array', items: toSchema(s.item) } : { type: 'array' };
    case 'union': return { anyOf: s.items.map(toSchema) };
    case 'obj': {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [k, p] of s.props) { properties[k] = toSchema(p.t); if (!p.opt) required.push(k); }
      return { type: 'object', properties, ...(required.length ? { required } : {}) };
    }
  }
}

type Target = 'ts-interface' | 'ts-type' | 'schema';

const JsonToTypes: React.FC<JsonToTypesProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState('');
  const [target, setTarget] = useState<Target>('ts-interface');
  const [rootName, setRootName] = useState('Root');

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' };
    try {
      const shape = infer(JSON.parse(input));
      if (target === 'schema') {
        return { output: JSON.stringify({ $schema: 'http://json-schema.org/draft-07/schema#', ...toSchema(shape) }, null, 2), error: '' };
      }
      return { output: toTypeScript(shape, rootName || 'Root', target === 'ts-type'), error: '' };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : 'Invalid JSON' };
    }
  }, [input, target, rootName]);

  const targets: { id: Target; label: string }[] = [
    { id: 'ts-interface', label: 'TS interface' },
    { id: 'ts-type', label: 'TS type' },
    { id: 'schema', label: 'JSON Schema' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">JSON → TypeScript / Schema</h2>
      <p className="text-slate-500 text-sm">Paste a JSON payload (e.g. an API response). Arrays of objects are merged, and keys missing from some items become optional.</p>

      <div className="flex flex-wrap items-center gap-2">
        {targets.map((t) => (
          <button
            key={t.id}
            onClick={() => setTarget(t.id)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              target === t.id ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
        {target !== 'schema' && (
          <input
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            className="ml-auto w-40 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            placeholder="Root type name"
          />
        )}
      </div>

      <textarea
        className="w-full h-56 p-4 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
        placeholder='{"id": 1, "user": {"name": "Ann"}, "tags": ["a"]}'
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{target === 'schema' ? 'JSON Schema' : 'TypeScript'}</span>
          <button
            onClick={() => output && onCopy(output, 'json-types')}
            disabled={!output}
            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${
              copyStatus === 'json-types' ? 'bg-green-500/10 text-green-400' : 'text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30'
            }`}
          >
            {copyStatus === 'json-types' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
        <pre className={`min-h-[100px] max-h-[420px] p-4 font-mono text-sm overflow-auto leading-relaxed ${error ? 'text-red-400' : 'text-blue-300/90'}`}>
          {error || output || <span className="text-slate-500 italic">Output will appear here...</span>}
        </pre>
      </div>
    </div>
  );
};

export default JsonToTypes;
