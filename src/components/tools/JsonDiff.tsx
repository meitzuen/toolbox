import React, { useState, useMemo } from 'react';
import { Plus, Minus } from 'lucide-react';

type DiffType = 'added' | 'removed' | 'changed' | 'unchanged' | 'nested';

interface DiffNode {
  key: string;
  type: DiffType;
  oldVal?: unknown;
  newVal?: unknown;
  children?: DiffNode[];
  depth: number;
}

function fmt(v: unknown): string {
  if (typeof v === 'string') return `"${v}"`;
  return JSON.stringify(v);
}

function diffObjects(a: unknown, b: unknown, key: string, depth: number): DiffNode {
  if (JSON.stringify(a) === JSON.stringify(b)) {
    return { type: 'unchanged', key, oldVal: a, depth };
  }

  const isPlainObj = (x: unknown): x is Record<string, unknown> =>
    x !== null && typeof x === 'object' && !Array.isArray(x);

  if (isPlainObj(a) && isPlainObj(b)) {
    const allKeys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    const children: DiffNode[] = allKeys.map(k => {
      if (!(k in a)) return { type: 'added' as DiffType, key: k, newVal: b[k], depth: depth + 1 };
      if (!(k in b)) return { type: 'removed' as DiffType, key: k, oldVal: a[k], depth: depth + 1 };
      return diffObjects(a[k], b[k], k, depth + 1);
    });
    return { type: 'nested', key, children, depth };
  }

  return { type: 'changed', key, oldVal: a, newVal: b, depth };
}

const DiffRow: React.FC<{ node: DiffNode }> = ({ node }) => {
  const pad = node.depth * 16;

  if (node.type === 'nested') {
    return (
      <>
        {node.key !== '__root__' && (
          <div style={{ paddingLeft: pad }} className="py-0.5 text-xs font-mono text-slate-600 font-semibold">
            {node.key}:
          </div>
        )}
        {node.children?.map((child, i) => <DiffRow key={`${child.key}-${i}`} node={child} />)}
      </>
    );
  }

  if (node.type === 'unchanged') {
    return (
      <div style={{ paddingLeft: pad + 12 }} className="py-0.5 text-xs font-mono text-slate-400 flex gap-2">
        <span className="w-3 shrink-0"> </span>
        <span className="font-medium">{node.key}:</span>
        <span>{fmt(node.oldVal)}</span>
      </div>
    );
  }

  if (node.type === 'added') {
    return (
      <div style={{ paddingLeft: pad + 12 }} className="py-0.5 text-xs font-mono bg-green-50 rounded flex gap-2">
        <span className="w-3 shrink-0 text-green-500 font-bold">+</span>
        <span className="text-green-700 font-medium">{node.key}:</span>
        <span className="text-green-600">{fmt(node.newVal)}</span>
      </div>
    );
  }

  if (node.type === 'removed') {
    return (
      <div style={{ paddingLeft: pad + 12 }} className="py-0.5 text-xs font-mono bg-red-50 rounded flex gap-2">
        <span className="w-3 shrink-0 text-red-500 font-bold">-</span>
        <span className="text-red-700 font-medium">{node.key}:</span>
        <span className="text-red-600">{fmt(node.oldVal)}</span>
      </div>
    );
  }

  // changed: show remove + add
  return (
    <>
      <div style={{ paddingLeft: pad + 12 }} className="py-0.5 text-xs font-mono bg-red-50 rounded flex gap-2">
        <span className="w-3 shrink-0 text-red-500 font-bold">-</span>
        <span className="text-red-700 font-medium">{node.key}:</span>
        <span className="text-red-600">{fmt(node.oldVal)}</span>
      </div>
      <div style={{ paddingLeft: pad + 12 }} className="py-0.5 text-xs font-mono bg-green-50 rounded flex gap-2">
        <span className="w-3 shrink-0 text-green-500 font-bold">+</span>
        <span className="text-green-700 font-medium">{node.key}:</span>
        <span className="text-green-600">{fmt(node.newVal)}</span>
      </div>
    </>
  );
};

const JsonDiff: React.FC = () => {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');

  const diffResult = useMemo(() => {
    if (!left.trim() || !right.trim()) return null;
    try {
      const a = JSON.parse(left);
      const b = JSON.parse(right);
      return { node: diffObjects(a, b, '__root__', 0), error: null };
    } catch (e) {
      return { node: null, error: (e as Error).message };
    }
  }, [left, right]);

  const stats = useMemo(() => {
    if (!diffResult?.node) return null;
    let added = 0, removed = 0, changed = 0;
    const count = (node: DiffNode) => {
      if (node.type === 'added') added++;
      else if (node.type === 'removed') removed++;
      else if (node.type === 'changed') changed++;
      node.children?.forEach(count);
    };
    count(diffResult.node);
    return { added, removed, changed };
  }, [diffResult]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">JSON Diff</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Left — Original</label>
          <textarea
            className="w-full h-48 p-4 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
            placeholder={'{\n  "name": "Alice",\n  "age": 30\n}'}
            value={left}
            onChange={e => setLeft(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Right — Modified</label>
          <textarea
            className="w-full h-48 p-4 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
            placeholder={'{\n  "name": "Alice",\n  "age": 31,\n  "city": "NYC"\n}'}
            value={right}
            onChange={e => setRight(e.target.value)}
          />
        </div>
      </div>

      {diffResult?.error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          Invalid JSON: {diffResult.error}
        </div>
      )}

      {diffResult?.node && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-4 text-xs font-medium">
              <span className="flex items-center gap-1 text-green-600">
                <Plus size={12} /> {stats?.added} added
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <Minus size={12} /> {stats?.removed} removed
              </span>
              <span className="text-amber-600 font-medium">
                ~ {stats?.changed} changed
              </span>
            </div>
            {stats && (stats.added + stats.removed + stats.changed === 0) && (
              <span className="text-xs text-green-600 font-semibold">No differences found</span>
            )}
          </div>
          <div className="p-4 max-h-96 overflow-auto space-y-0.5">
            <DiffRow node={diffResult.node} />
          </div>
        </div>
      )}

      {!diffResult && (
        <div className="p-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
          Paste JSON in both panels above to see the diff
        </div>
      )}
    </div>
  );
};

export default JsonDiff;
