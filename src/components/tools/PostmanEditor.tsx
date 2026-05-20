import React, { useState, useMemo } from 'react';
import {
  Upload, Download, AlertCircle, Check,
  ChevronRight, ChevronDown, Folder, FolderOpen, FileText,
  Trash2, Search, Edit3,
} from 'lucide-react';

// ---- Types ----

interface PostmanEvent {
  listen: string;
  script: { exec: string | string[]; type?: string; [key: string]: unknown };
  [key: string]: unknown;
}

interface PostmanItem {
  name: string;
  item?: PostmanItem[];
  event?: PostmanEvent[];
  [key: string]: unknown;
}

interface PostmanCollection {
  info: { name: string; schema: string; [key: string]: unknown };
  item: PostmanItem[];
  event?: PostmanEvent[];
  [key: string]: unknown;
}

// ---- Tree node (UI only) ----

interface TreeNode {
  id: string;        // dot-indexed path e.g. "0", "0.2", "1.0.3"
  name: string;
  isFolder: boolean;
  hasTest: boolean;
  hasPre: boolean;
  childIds: string[];
  parentId: string | null;
  depth: number;
}

function buildTree(
  items: PostmanItem[],
  parentId: string | null,
  prefix: string,
  depth: number,
): { map: Map<string, TreeNode>; ids: string[] } {
  const map = new Map<string, TreeNode>();
  const ids: string[] = [];

  items.forEach((item, i) => {
    const id = prefix ? `${prefix}.${i}` : String(i);
    const isFolder = Array.isArray(item.item);
    let childIds: string[] = [];

    if (isFolder && item.item) {
      const sub = buildTree(item.item, id, id, depth + 1);
      sub.map.forEach((v, k) => map.set(k, v));
      childIds = sub.ids;
    }

    map.set(id, {
      id,
      name: item.name,
      isFolder,
      hasTest: !!(item.event?.some(e => e.listen === 'test')),
      hasPre: !!(item.event?.some(e => e.listen === 'prerequest')),
      childIds,
      parentId,
      depth,
    });
    ids.push(id);
  });

  return { map, ids };
}

function allDescendants(id: string, map: Map<string, TreeNode>): string[] {
  const node = map.get(id);
  if (!node) return [];
  const result: string[] = [];
  for (const cid of node.childIds) {
    result.push(cid);
    result.push(...allDescendants(cid, map));
  }
  return result;
}

function getItem(root: PostmanItem[], id: string): PostmanItem | null {
  const parts = id.split('.').map(Number);
  let arr = root;
  let item: PostmanItem | null = null;
  for (const idx of parts) {
    if (!arr[idx]) return null;
    item = arr[idx];
    arr = item.item ?? [];
  }
  return item;
}

// ---- Op types ----

type OpType = 'remove' | 'find-replace' | 'set-script';

// ---- Component ----

const PostmanEditor: React.FC = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [collection, setCollection] = useState<PostmanCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyLog, setApplyLog] = useState<string[]>([]);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [op, setOp] = useState<OpType>('remove');
  const [rmTest, setRmTest] = useState(true);
  const [rmPre, setRmPre] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [frTest, setFrTest] = useState(true);
  const [frPre, setFrPre] = useState(true);
  const [setScriptType, setSetScriptType] = useState<'test' | 'prerequest'>('test');
  const [setScriptContent, setSetScriptContent] = useState('');

  const { nodeMap, rootIds } = useMemo(() => {
    if (!collection) return { nodeMap: new Map<string, TreeNode>(), rootIds: [] as string[] };
    const { map, ids } = buildTree(collection.item, null, '', 0);
    return { nodeMap: map, rootIds: ids };
  }, [collection]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setApplyLog([]);
    setSelected(new Set());
    setExpanded(new Set());
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string) as PostmanCollection;
        if (!json.info || !json.item) throw new Error('Invalid format');
        setCollection(json);
      } catch {
        setError('Failed to parse JSON. Please ensure it is a valid Postman Collection.');
        setCollection(null);
      }
    };
    reader.readAsText(file);
  };

  // Returns 'none' | 'partial' | 'all' for a node's checkbox state
  const selState = (id: string): 'none' | 'partial' | 'all' => {
    const all = [id, ...allDescendants(id, nodeMap)];
    const count = all.filter(i => selected.has(i)).length;
    if (count === 0) return 'none';
    if (count === all.length) return 'all';
    return 'partial';
  };

  const toggleSelect = (id: string) => {
    const state = selState(id);
    const ids = [id, ...allDescendants(id, nodeMap)];
    setSelected(prev => {
      const next = new Set(prev);
      if (state === 'all') ids.forEach(i => next.delete(i));
      else ids.forEach(i => next.add(i));
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set<string>();
    nodeMap.forEach((_, id) => all.add(id));
    setSelected(all);
  };

  const expandAll = () => {
    const folders = new Set<string>();
    nodeMap.forEach((n, id) => { if (n.isFolder) folders.add(id); });
    setExpanded(folders);
  };

  const applyOp = () => {
    if (!collection || selected.size === 0) return;
    const newColl = JSON.parse(JSON.stringify(collection)) as PostmanCollection;
    let changed = 0;

    for (const id of selected) {
      const item = getItem(newColl.item, id);
      if (!item) continue;

      if (op === 'remove') {
        const targets = new Set<string>();
        if (rmTest) targets.add('test');
        if (rmPre) targets.add('prerequest');
        if (!item.event || targets.size === 0) continue;
        const before = item.event.length;
        item.event = item.event.filter(e => !targets.has(e.listen));
        if (item.event.length === 0) delete item.event;
        if ((item.event?.length ?? 0) < before) changed++;

      } else if (op === 'find-replace') {
        if (!findText || !item.event) continue;
        item.event.forEach(ev => {
          if ((ev.listen === 'test' && !frTest) || (ev.listen === 'prerequest' && !frPre)) return;
          const exec = ev.script.exec;
          const code = Array.isArray(exec) ? exec.join('\n') : exec;
          const updated = code.split(findText).join(replaceText);
          if (updated !== code) {
            ev.script.exec = updated.split('\n');
            changed++;
          }
        });

      } else if (op === 'set-script') {
        const lines = setScriptContent.split('\n');
        const existing = item.event?.find(e => e.listen === setScriptType);
        if (existing) {
          existing.script.exec = lines;
        } else {
          if (!item.event) item.event = [];
          item.event.push({ listen: setScriptType, script: { exec: lines, type: 'text/javascript' } });
        }
        changed++;
      }
    }

    setCollection(newColl);
    const label = op === 'remove' ? 'Remove scripts' : op === 'find-replace' ? 'Find & Replace' : 'Set script';
    setApplyLog(prev => [`${label} — ${selected.size} item(s) targeted, ${changed} modified`, ...prev.slice(0, 4)]);
  };

  const download = () => {
    if (!collection) return;
    const blob = new Blob([JSON.stringify(collection, null, 4)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edited-${fileName ?? 'collection.json'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canApply =
    selected.size > 0 &&
    (op === 'remove' ? rmTest || rmPre
      : op === 'find-replace' ? !!findText && (frTest || frPre)
      : op === 'set-script' ? !!setScriptContent.trim()
      : false);

  const renderNode = (id: string): React.ReactNode => {
    const node = nodeMap.get(id);
    if (!node) return null;
    const ss = selState(id);
    const isExp = expanded.has(id);

    return (
      <div key={id}>
        <div
          className={`flex items-center gap-1 py-[3px] rounded ${ss === 'all' ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
          style={{ paddingLeft: `${node.depth * 14 + 4}px`, paddingRight: '8px' }}
        >
          {/* Expand toggle */}
          <span
            className="w-4 h-4 flex items-center justify-center text-slate-400 flex-shrink-0 cursor-pointer"
            onClick={() => node.isFolder && toggleExpand(id)}
          >
            {node.isFolder
              ? (isExp ? <ChevronDown size={12} /> : <ChevronRight size={12} />)
              : <span className="w-4" />}
          </span>

          {/* Checkbox with indeterminate support */}
          <input
            type="checkbox"
            checked={ss === 'all'}
            ref={el => { if (el) el.indeterminate = ss === 'partial'; }}
            onChange={() => toggleSelect(id)}
            className="w-3.5 h-3.5 accent-indigo-600 flex-shrink-0 cursor-pointer"
          />

          {/* Icon */}
          <span className="text-slate-400 flex-shrink-0 mx-0.5">
            {node.isFolder
              ? (isExp ? <FolderOpen size={12} /> : <Folder size={12} />)
              : <FileText size={12} />}
          </span>

          {/* Name */}
          <span
            className="text-xs text-slate-700 flex-1 truncate cursor-pointer min-w-0"
            onClick={() => node.isFolder ? toggleExpand(id) : toggleSelect(id)}
            title={node.name}
          >
            {node.name}
          </span>

          {/* Script badges */}
          <span className="flex gap-0.5 flex-shrink-0 ml-1">
            {node.hasTest && <span className="text-[9px] px-1 rounded bg-blue-100 text-blue-600 font-mono leading-4">T</span>}
            {node.hasPre  && <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-600 font-mono leading-4">P</span>}
          </span>
        </div>

        {node.isFolder && isExp && node.childIds.map(cid => renderNode(cid))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Postman Collection Editor</h2>
        <Edit3 className="text-indigo-500" size={32} />
      </div>

      <p className="text-slate-600">
        Upload a Postman Collection to batch-edit scripts across multiple requests and folders.
      </p>

      {/* Upload */}
      <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
        collection ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'
      }`}>
        <input
          type="file"
          id="editor-upload"
          className="hidden"
          accept=".json,.postman_collection"
          onChange={handleUpload}
        />
        <label htmlFor="editor-upload" className="cursor-pointer flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Upload size={20} />
          </div>
          <p className="font-medium text-slate-800">{fileName || 'Click to upload or drag and drop'}</p>
          <p className="text-sm text-slate-500">Postman Collection .json or .postman_collection</p>
        </label>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {collection && (
        <div className="grid grid-cols-5 gap-4 items-start">

          {/* ── Tree panel ── */}
          <div className="col-span-3 border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Collection</p>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button onClick={selectAll}               className="text-xs text-indigo-600 hover:text-indigo-700">All</button>
                <span className="text-slate-300">|</span>
                <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-700">None</button>
                <span className="text-slate-300">|</span>
                <button onClick={expandAll}               className="text-xs text-slate-500 hover:text-slate-700">Expand all</button>
                <span className="text-slate-300">|</span>
                <button onClick={() => setExpanded(new Set())} className="text-xs text-slate-500 hover:text-slate-700">Collapse</button>
              </div>
            </div>

            <div className="p-2 max-h-[460px] overflow-y-auto">
              {rootIds.map(id => renderNode(id))}
            </div>

            <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center gap-3 flex-wrap">
              <p className="text-xs text-slate-500">{selected.size} selected</p>
              <span className="text-slate-300">·</span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <span className="bg-blue-100 text-blue-600 font-mono px-1 rounded">T</span> Test
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <span className="bg-amber-100 text-amber-600 font-mono px-1 rounded">P</span> Pre-request
              </span>
            </div>
          </div>

          {/* ── Operations panel ── */}
          <div className="col-span-2 space-y-3">

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Batch Operation</p>
              </div>
              <div className="p-3 space-y-3">

                {/* Op selector */}
                <div className="flex gap-1">
                  {([
                    { id: 'remove' as OpType,       label: 'Remove',     icon: Trash2 },
                    { id: 'find-replace' as OpType,  label: 'Find & Replace', icon: Search },
                    { id: 'set-script' as OpType,    label: 'Set Script', icon: Edit3 },
                  ]).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setOp(id)}
                      className={`flex-1 py-1.5 px-1 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1 ${
                        op === id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Icon size={11} />{label}
                    </button>
                  ))}
                </div>

                {/* Remove */}
                {op === 'remove' && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Script types to remove from selected items:</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={rmTest} onChange={e => setRmTest(e.target.checked)} className="accent-indigo-600" />
                      <span className="text-xs text-slate-700">Test scripts</span>
                      <span className="bg-blue-100 text-blue-600 font-mono text-[9px] px-1 rounded">T</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={rmPre} onChange={e => setRmPre(e.target.checked)} className="accent-indigo-600" />
                      <span className="text-xs text-slate-700">Pre-request scripts</span>
                      <span className="bg-amber-100 text-amber-600 font-mono text-[9px] px-1 rounded">P</span>
                    </label>
                  </div>
                )}

                {/* Find & Replace */}
                {op === 'find-replace' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Find</label>
                      <input
                        value={findText}
                        onChange={e => setFindText(e.target.value)}
                        placeholder="Text to find…"
                        className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Replace with</label>
                      <input
                        value={replaceText}
                        onChange={e => setReplaceText(e.target.value)}
                        placeholder="Replacement (empty = delete)"
                        className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <p className="text-xs text-slate-500">Search inside:</p>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={frTest} onChange={e => setFrTest(e.target.checked)} className="accent-indigo-600" />
                        <span className="text-xs">Test <span className="bg-blue-100 text-blue-600 font-mono text-[9px] px-0.5 rounded">T</span></span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={frPre} onChange={e => setFrPre(e.target.checked)} className="accent-indigo-600" />
                        <span className="text-xs">Pre-req <span className="bg-amber-100 text-amber-600 font-mono text-[9px] px-0.5 rounded">P</span></span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Set Script */}
                {op === 'set-script' && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Script type to set:</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSetScriptType('test')}
                        className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                          setScriptType === 'test'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Test <span className="font-mono">T</span>
                      </button>
                      <button
                        onClick={() => setSetScriptType('prerequest')}
                        className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                          setScriptType === 'prerequest'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Pre-request <span className="font-mono">P</span>
                      </button>
                    </div>
                    <label className="block text-xs text-slate-500">Script content:</label>
                    <textarea
                      value={setScriptContent}
                      onChange={e => setSetScriptContent(e.target.value)}
                      placeholder="Paste your script here…"
                      rows={8}
                      className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-400 resize-y"
                    />
                    <p className="text-[10px] text-slate-400">
                      Overwrites the existing script of this type on each selected item, or adds it if missing.
                    </p>
                  </div>
                )}

                <button
                  onClick={applyOp}
                  disabled={!canApply}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Apply to {selected.size} item{selected.size !== 1 ? 's' : ''}
                </button>
              </div>
            </div>

            {/* Operation log */}
            {applyLog.length > 0 && (
              <div className="border border-green-100 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-green-50 border-b border-green-100">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wider">History</p>
                </div>
                <ul className="divide-y divide-slate-100">
                  {applyLog.map((msg, i) => (
                    <li key={i} className="px-3 py-1.5 flex items-start gap-2">
                      <Check size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-slate-600">{msg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Download */}
            <button
              onClick={download}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Download size={16} /> Download Modified Collection
            </button>
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="bg-slate-100 p-4 rounded-lg text-xs text-slate-500 leading-relaxed">
        <h4 className="font-bold text-slate-700 mb-2 uppercase tracking-wider">How to use:</h4>
        <ul className="list-disc ml-4 space-y-1">
          <li>Upload your Postman Collection JSON. The tree shows all folders and requests.</li>
          <li>Click a folder checkbox to select it <strong>and all its children</strong>. Click again to deselect everything.</li>
          <li><span className="bg-blue-100 text-blue-600 font-mono px-1 rounded">T</span> = has Test script, <span className="bg-amber-100 text-amber-600 font-mono px-1 rounded">P</span> = has Pre-request script (badges update after each apply).</li>
          <li><strong>Remove</strong> — deletes Test/Pre-request scripts from each selected item.</li>
          <li><strong>Find & Replace</strong> — text substitution inside scripts of selected items.</li>
          <li><strong>Set Script</strong> — paste a script once, apply it to all selected items at once.</li>
          <li>Apply operations multiple times, then download the modified collection.</li>
        </ul>
      </div>
    </div>
  );
};

export default PostmanEditor;
