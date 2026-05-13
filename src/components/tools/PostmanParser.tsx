import React, { useState } from 'react';
import { Upload, Download, FolderDown, Check, AlertCircle, FileText } from 'lucide-react';
import JSZip from 'jszip';

// ----- Types (Postman Collection v2.1 JSON) -----

interface PostmanUrl {
  raw?: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  query?: { key: string; value: string; disabled?: boolean }[];
  variable?: { key: string; value: string }[];
}

interface PostmanHeader {
  key: string;
  value: string;
  disabled?: boolean;
  description?: string;
}

interface PostmanBody {
  mode: string;
  raw?: string;
  formdata?: { key: string; value: string; type?: string; disabled?: boolean }[];
  urlencoded?: { key: string; value: string; disabled?: boolean }[];
  options?: { raw?: { language?: string } };
}

interface PostmanScript {
  id?: string;
  type?: string;
  exec: string | string[];
}

interface PostmanEvent {
  listen: 'test' | 'prerequest' | string;
  script: PostmanScript;
}

interface PostmanRequest {
  url?: string | PostmanUrl;
  method?: string;
  header?: PostmanHeader[];
  body?: PostmanBody;
  description?: string;
}

interface PostmanItem {
  name: string;
  request?: PostmanRequest;
  event?: PostmanEvent[];
  item?: PostmanItem[];
  [key: string]: unknown;
}

interface PostmanCollection {
  info: { name: string; schema: string; [key: string]: unknown };
  item: PostmanItem[];
  [key: string]: unknown;
}

// ----- Parser logic -----

const PREFIXES = ['INTL', 'FN', 'FA', 'FET', 'BT'];

// Matches the original parser.js regex: /[\\/:\*\?"<>\|]/g
const INVALID_FILENAME_CHARS = /[/\\:*?"<>|]/g;

interface LeafEntry {
  item: PostmanItem;
  zipPath: string; // full path inside ZIP, e.g. "Spec/Functional Test/FN_01_ desc.txt"
}

function sanitize(name: string): string {
  return name.replace(INVALID_FILENAME_CHARS, '_');
}

function isInt(value: string): boolean {
  const x = parseFloat(value);
  return !isNaN(Number(value)) && (x | 0) === x;
}

function shouldProcess(item: PostmanItem): boolean {
  const colonIdx = item.name.indexOf(':');
  if (colonIdx === -1) return false;
  const prefix = item.name.substring(0, colonIdx).toUpperCase();
  // prefix.startsWith(p) — so FN_01 matches FN, FET_01 matches FET, BT_01 matches BT, etc.
  return (
    PREFIXES.some(p => prefix.startsWith(p)) ||
    (prefix.startsWith('C') && isInt(prefix.substring(1)))
  );
}

function collectLeafEntries(items: PostmanItem[], folderPath: string[] = []): LeafEntry[] {
  const result: LeafEntry[] = [];
  for (const item of items) {
    if (item.item && Array.isArray(item.item) && item.item.length > 0) {
      result.push(...collectLeafEntries(item.item, [...folderPath, sanitize(item.name)]));
    } else {
      const fileName = sanitize(item.name) + '.txt';
      const zipPath = folderPath.length > 0 ? `${folderPath.join('/')}/${fileName}` : fileName;
      result.push({ item, zipPath });
    }
  }
  return result;
}

function resolveUrl(url: string | PostmanUrl | undefined): string {
  if (!url) return '';
  if (typeof url === 'string') return url;
  return url.raw ?? [
    url.protocol ? `${url.protocol}://` : '',
    (url.host ?? []).join('.'),
    '/',
    (url.path ?? []).join('/'),
  ].join('');
}

function buildRequestBlock(item: PostmanItem): string {
  const req = item.request;
  if (!req) return '';

  const output: Record<string, unknown> = {
    url: resolveUrl(req.url),
    method: req.method ?? '',
    header: req.header ?? [],
  };

  if (req.body) {
    const body: Record<string, unknown> = { mode: req.body.mode };
    if (req.body.mode === 'raw' && req.body.raw !== undefined) {
      try {
        body.raw = JSON.parse(req.body.raw);
      } catch {
        body.raw = req.body.raw;
      }
      if (req.body.options) body.options = req.body.options;
    } else if (req.body.mode === 'formdata') {
      body.formdata = req.body.formdata;
    } else if (req.body.mode === 'urlencoded') {
      body.urlencoded = req.body.urlencoded;
    }
    output.body = body;
  }

  return 'REQUEST\n' + JSON.stringify(output, null, 4) + '\n-------\n';
}

function buildScriptBlocks(item: PostmanItem): string {
  if (!item.event || item.event.length === 0) return '';

  let output = '';
  for (const event of item.event) {
    const execRaw = event.script?.exec ?? [];
    const rawLines = Array.isArray(execRaw) ? execRaw : [execRaw];
    // Strip trailing \r so output is clean regardless of source line endings
    const lines = rawLines.map(l => l.replace(/\r$/, ''));
    if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) continue;

    output += event.listen.toUpperCase() + '\n';
    output += lines.join('\n') + '\n';
    output += '-------\n';
  }
  return output;
}

// ----- Stats type -----

interface ParseStats {
  total: number;
  matched: number;
  skipped: number;
  entries: LeafEntry[];
}

// ----- Component -----

const PostmanParser: React.FC = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [collection, setCollection] = useState<PostmanCollection | null>(null);
  const [stats, setStats] = useState<ParseStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setIsDone(false);
    setStats(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as PostmanCollection;
        if (!json.info || !json.item) throw new Error('Invalid format');

        const allEntries = collectLeafEntries(json.item);
        const matched = allEntries.filter(e => shouldProcess(e.item));

        setStats({
          total: allEntries.length,
          matched: matched.length,
          skipped: allEntries.length - matched.length,
          entries: matched,
        });
        setCollection(json);
      } catch {
        setError('Failed to parse JSON. Please ensure it is a valid Postman Collection.');
        setCollection(null);
      }
    };
    reader.readAsText(file);
  };

  const processAndDownload = async () => {
    if (!collection) return;
    setIsProcessing(true);
    setError(null);

    try {
      const zip = new JSZip();
      const allEntries = collectLeafEntries(collection.item);

      for (const { item, zipPath } of allEntries) {
        if (!shouldProcess(item)) continue;
        const content = buildRequestBlock(item) + buildScriptBlocks(item);
        zip.file(zipPath, content);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = fileName?.replace(/\.[^.]+$/, '') ?? 'collection';
      a.download = `parsed-${baseName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsDone(true);
    } catch {
      setError('An error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setCollection(null);
    setFileName(null);
    setIsDone(false);
    setStats(null);
    setError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Postman Collection Parser</h2>
        <FolderDown className="text-indigo-500" size={32} />
      </div>

      <p className="text-slate-600">
        Upload a Postman Collection to extract matching requests and scripts into individual text files, bundled as a ZIP.
      </p>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          fileName ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'
        }`}
      >
        <input
          type="file"
          id="parser-upload"
          className="hidden"
          accept=".json,.postman_collection"
          onChange={handleFileUpload}
        />
        <label htmlFor="parser-upload" className="cursor-pointer flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Upload size={24} />
          </div>
          <div>
            <p className="font-medium text-slate-800">
              {fileName || 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-slate-500">Postman Collection .json or .postman_collection</p>
          </div>
        </label>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Stats + Preview */}
      {stats && !isDone && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-700">{stats.total}</p>
              <p className="text-xs text-slate-500 mt-1">Total Requests</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{stats.matched}</p>
              <p className="text-xs text-slate-500 mt-1">Will Extract</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-400">{stats.skipped}</p>
              <p className="text-xs text-slate-500 mt-1">Skipped</p>
            </div>
          </div>

          {stats.entries.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Files to be extracted</p>
              </div>
              <ul className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                {stats.entries.map(({ zipPath }, i) => {
                  const parts = zipPath.split('/');
                  const file = parts.pop()!;
                  const folder = parts.join(' / ');
                  return (
                    <li key={i} className="px-4 py-2 flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-indigo-400 shrink-0" />
                      <span className="text-xs font-mono min-w-0">
                        {folder && (
                          <span className="text-slate-400">{folder} / </span>
                        )}
                        <span className="text-slate-700">{file}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {stats.matched === 0 ? (
            <div className="bg-amber-50 text-amber-700 p-4 rounded-lg border border-amber-100 text-sm">
              No matching requests found. Items must follow the pattern{' '}
              <code className="bg-amber-100 px-1 rounded">PREFIX: name</code> where prefix is one of:{' '}
              <strong>INTL, FN, FA, FET, BT</strong>, or <strong>C</strong> followed by a number.
            </div>
          ) : (
            <button
              onClick={processAndDownload}
              disabled={isProcessing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                'Processing...'
              ) : (
                <><Download size={18} /> Extract & Download ZIP ({stats.matched} files)</>
              )}
            </button>
          )}
        </div>
      )}

      {isDone && (
        <div className="space-y-4">
          <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3 border border-green-100">
            <Check size={20} />
            <span className="text-sm font-medium">
              Successfully extracted {stats?.matched} file{stats?.matched !== 1 ? 's' : ''} into a ZIP archive.
            </span>
          </div>
          <button
            onClick={processAndDownload}
            disabled={isProcessing}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download size={20} /> Download Again
          </button>
          <button
            onClick={reset}
            className="w-full text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
          >
            Upload another file
          </button>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-slate-100 p-4 rounded-lg text-xs text-slate-500 leading-relaxed">
        <h4 className="font-bold text-slate-700 mb-2 uppercase tracking-wider">What it does:</h4>
        <ul className="list-disc ml-4 space-y-1">
          <li>Traverses all folders and nested items recursively to find leaf-level requests.</li>
          <li>
            Extracts requests whose names match prefixes:{' '}
            <code className="bg-slate-200 px-1 rounded">INTL</code>,{' '}
            <code className="bg-slate-200 px-1 rounded">FN</code>,{' '}
            <code className="bg-slate-200 px-1 rounded">FA</code>,{' '}
            <code className="bg-slate-200 px-1 rounded">FET</code>,{' '}
            <code className="bg-slate-200 px-1 rounded">BT</code>, or{' '}
            <code className="bg-slate-200 px-1 rounded">C&lt;number&gt;</code> followed by{' '}
            <code className="bg-slate-200 px-1 rounded">:</code>.
          </li>
          <li>Each file contains the REQUEST block (URL, method, headers, body) and any PREREQUEST / TEST scripts.</li>
          <li>JSON bodies are pretty-printed; Postman template variables are preserved as-is.</li>
          <li>Files are organized into subfolders matching the collection structure inside the ZIP.</li>
        </ul>
      </div>
    </div>
  );
};

export default PostmanParser;
