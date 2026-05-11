import React, { useState } from 'react';
import { Upload, Download, FileJson, Check, AlertCircle } from 'lucide-react';
import beautify from 'js-beautify';

interface PostmanEvent {
  listen: string;
  script: {
    exec: string | string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface PostmanItem {
  name?: string;
  request?: {
    body?: {
      mode: string;
      raw?: string;
      options?: {
        raw?: {
          language?: string;
        };
      };
    };
    [key: string]: unknown;
  };
  event?: PostmanEvent[];
  item?: PostmanItem[];
  [key: string]: unknown;
}

interface PostmanCollection {
  info: {
    name: string;
    schema: string;
    [key: string]: unknown;
  };
  item: PostmanItem[];
  event?: PostmanEvent[];
  [key: string]: unknown;
}

const PostmanBeautifier: React.FC = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [collection, setCollection] = useState<PostmanCollection | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setIsDone(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as PostmanCollection;
        if (!json.info || !json.item) {
          throw new Error('Invalid Postman Collection format');
        }
        setCollection(json);
      } catch {
        setError('Failed to parse JSON. Please ensure it is a valid Postman Collection.');
        setCollection(null);
      }
    };
    reader.readAsText(file);
  };

  const beautifyScripts = (event: PostmanEvent) => {
    if (event?.script?.exec) {
      const exec = event.script.exec;
      const code = Array.isArray(exec) ? exec.join('\n') : exec;
      const formatted = beautify.js(code, {
        indent_size: 2,
        space_in_empty_paren: true,
        preserve_newlines: true,
        break_chained_methods: false,
      });
      event.script.exec = formatted.split('\n');
    }
  };

  const beautifyItem = (item: PostmanItem) => {
    // 1. Beautify Request Body
    if (item.request?.body?.mode === 'raw' && item.request.body.options?.raw?.language === 'json') {
      try {
        const raw = item.request.body.raw;
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          item.request.body.raw = JSON.stringify(parsed, null, 2);
        }
      } catch {
        // Skip if not valid JSON
      }
    }

    // 2. Beautify Scripts (Pre-request/Tests)
    if (item.event) {
      item.event.forEach(beautifyScripts);
    }

    // 3. Recurse if folder
    if (item.item && Array.isArray(item.item)) {
      item.item.forEach(beautifyItem);
    }
  };

  const processCollection = () => {
    if (!collection) return;

    setIsProcessing(true);
    setError(null);

    // Deep clone to avoid mutating state directly during process
    const newCollection = JSON.parse(JSON.stringify(collection)) as PostmanCollection;

    try {
      // Beautify top-level events
      if (newCollection.event) {
        newCollection.event.forEach(beautifyScripts);
      }

      // Beautify items
      newCollection.item.forEach(beautifyItem);

      setCollection(newCollection);
      setIsDone(true);
    } catch {
      setError('An error occurred during beautification.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCollection = () => {
    if (!collection) return;

    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName ? `beautified-${fileName}` : 'beautified-collection.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Postman Collection Beautifier</h2>
        <FileJson className="text-indigo-500" size={32} />
      </div>

      <p className="text-slate-600">
        Upload a Postman Collection (v2.1+) to beautify all request bodies (JSON) and scripts (Pre-request/Tests).
      </p>

      <div className="grid grid-cols-1 gap-6">
        {/* Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            fileName ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'
          }`}
        >
          <input
            type="file"
            id="collection-upload"
            className="hidden"
            accept=".json"
            onChange={handleFileUpload}
          />
          <label htmlFor="collection-upload" className="cursor-pointer flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Upload size={24} />
            </div>
            <div>
              <p className="font-medium text-slate-800">
                {fileName || 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-slate-500">Postman Collection .json</p>
            </div>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {collection && !isDone && (
          <button
            onClick={processCollection}
            disabled={isProcessing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Beautify Collection'}
          </button>
        )}

        {isDone && (
          <div className="space-y-4">
            <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3 border border-green-100">
              <Check size={20} />
              <span className="text-sm font-medium">Successfully beautified!</span>
            </div>
            <button
              onClick={downloadCollection}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download size={20} /> Download Beautified Collection
            </button>
            <button
              onClick={() => {
                setCollection(null);
                setFileName(null);
                setIsDone(false);
              }}
              className="w-full text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            >
              Upload another file
            </button>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-slate-100 p-4 rounded-lg text-xs text-slate-500 leading-relaxed">
        <h4 className="font-bold text-slate-700 mb-2 uppercase tracking-wider">What it does:</h4>
        <ul className="list-disc ml-4 space-y-1">
          <li>Formats <code className="bg-slate-200 px-1 rounded">raw</code> JSON request bodies with 2-space indentation.</li>
          <li>Beautifies <code className="bg-slate-200 px-1 rounded">Pre-request</code> and <code className="bg-slate-200 px-1 rounded">Tests</code> scripts using js-beautify.</li>
          <li>Traverses all folders and nested items recursively.</li>
          <li>Handles top-level collection scripts.</li>
        </ul>
      </div>
    </div>
  );
};

export default PostmanBeautifier;
