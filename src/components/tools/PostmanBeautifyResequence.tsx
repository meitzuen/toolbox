import React, { useState } from 'react';
import { Upload, Download, Check, AlertCircle, Wand2 } from 'lucide-react';
import beautify from 'js-beautify';

interface PostmanEvent {
  listen: string;
  script: { exec: string | string[]; [key: string]: unknown };
  [key: string]: unknown;
}

interface PostmanItem {
  name: string;
  request?: {
    body?: { mode: string; raw?: string; options?: { raw?: { language?: string } } };
    [key: string]: unknown;
  };
  event?: PostmanEvent[];
  item?: PostmanItem[];
  [key: string]: unknown;
}

interface PostmanCollection {
  info: { name: string; schema: string; [key: string]: unknown };
  item: PostmanItem[];
  event?: PostmanEvent[];
  [key: string]: unknown;
}

const VALID_TEST_TYPES = ['Functional Test', 'Force Error Test', 'Boundary Test'];
const TEST_TYPE_PREFIX: Record<string, string> = {
  'Functional Test': 'FN',
  'Force Error Test': 'FET',
  'Boundary Test': 'BT',
};
const IGNORE_SPEC = ['Init'];
const IGNORE_TESTCASE_PREFIXES = ['PRE', 'CHECK'];

function beautifyScripts(event: PostmanEvent) {
  if (!event?.script?.exec) return;
  const code = Array.isArray(event.script.exec)
    ? event.script.exec.join('\n')
    : event.script.exec;
  const formatted = beautify.js(code, {
    indent_size: 4,
    space_in_empty_paren: true,
    preserve_newlines: true,
    break_chained_methods: false,
  });
  event.script.exec = formatted.split('\n');
}

function beautifyItem(item: PostmanItem) {
  if (
    item.request?.body?.mode === 'raw' &&
    item.request.body.options?.raw?.language === 'json' &&
    item.request.body.raw
  ) {
    try {
      item.request.body.raw = JSON.stringify(
        JSON.parse(item.request.body.raw) as unknown,
        null,
        4,
      );
    } catch { /* skip invalid JSON */ }
  }
  item.event?.forEach(beautifyScripts);
  item.item?.forEach(beautifyItem);
}

function resequenceTestCase(testCase: PostmanItem, prefix: string, index: number): number {
  const name = testCase.name;
  if (IGNORE_TESTCASE_PREFIXES.some((p) => name.startsWith(p))) return index;
  if (!name.includes(':')) return index;
  const content = name.split(':').slice(1).join(':');
  testCase.name = `${prefix}_${index.toString().padStart(2, '0')}:${content}`;
  return index + 1;
}

function resequenceItems(items: PostmanItem[]) {
  for (const spec of items) {
    if (IGNORE_SPEC.includes(spec.name)) continue;
    if (!spec.item) continue;
    for (const testType of spec.item) {
      if (!VALID_TEST_TYPES.includes(testType.name) || !testType.item) continue;
      const prefix = TEST_TYPE_PREFIX[testType.name];
      let index = 1;
      for (const child of testType.item) {
        if (child.item) {
          for (const testCase of child.item) {
            index = resequenceTestCase(testCase, prefix, index);
          }
        } else {
          index = resequenceTestCase(child, prefix, index);
        }
      }
    }
  }
}

const PostmanBeautifyResequence: React.FC = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [collection, setCollection] = useState<PostmanCollection | null>(null);
  const [doBeautify, setDoBeautify] = useState(true);
  const [doResequence, setDoResequence] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [result, setResult] = useState<PostmanCollection | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setIsDone(false);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string) as PostmanCollection;
        if (!json.info || !json.item) throw new Error();
        setCollection(json);
      } catch {
        setError('Failed to parse JSON. Please ensure it is a valid Postman Collection.');
        setCollection(null);
      }
    };
    reader.readAsText(file);
  };

  const process = () => {
    if (!collection) return;
    setIsProcessing(true);
    setError(null);
    try {
      const cloned = JSON.parse(JSON.stringify(collection)) as PostmanCollection;
      if (doBeautify) {
        cloned.event?.forEach(beautifyScripts);
        cloned.item.forEach(beautifyItem);
      }
      if (doResequence) {
        resequenceItems(cloned.item);
      }
      setResult(cloned);
      setIsDone(true);
    } catch {
      setError('An error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 4)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName ? `processed-${fileName}` : 'processed-collection.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setCollection(null);
    setFileName(null);
    setIsDone(false);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Postman Collection Tools</h2>
        <Wand2 className="text-indigo-500" size={32} />
      </div>

      <p className="text-slate-600">
        Upload a collection once and apply beautification, resequencing, or both in a single pass.
      </p>

      {/* Upload */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          fileName ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'
        }`}
      >
        <input
          type="file"
          id="collection-upload"
          className="hidden"
          accept=".json,.postman_collection"
          onChange={handleFileUpload}
        />
        <label htmlFor="collection-upload" className="cursor-pointer flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Upload size={24} />
          </div>
          <div>
            <p className="font-medium text-slate-800">
              {fileName ?? 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-slate-500">Postman Collection .json or .postman_collection</p>
          </div>
        </label>
      </div>

      {/* Options */}
      {collection && !isDone && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-600">Operations to apply</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={doBeautify}
              onChange={(e) => setDoBeautify(e.target.checked)}
              className="w-4 h-4 accent-indigo-600"
            />
            <span className="text-sm text-slate-700">Beautify request bodies & scripts</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={doResequence}
              onChange={(e) => setDoResequence(e.target.checked)}
              className="w-4 h-4 accent-indigo-600"
            />
            <span className="text-sm text-slate-700">Resequence test case names</span>
          </label>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {collection && !isDone && (
        <button
          onClick={process}
          disabled={isProcessing || (!doBeautify && !doResequence)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing ? 'Processing…' : 'Process Collection'}
        </button>
      )}

      {isDone && (
        <div className="space-y-4">
          <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3 border border-green-100">
            <Check size={20} />
            <span className="text-sm font-medium">Done! Collection processed successfully.</span>
          </div>
          <button
            onClick={download}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download size={20} /> Download Processed Collection
          </button>
          <button
            onClick={reset}
            className="w-full text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
          >
            Upload another file
          </button>
        </div>
      )}
    </div>
  );
};

export default PostmanBeautifyResequence;
