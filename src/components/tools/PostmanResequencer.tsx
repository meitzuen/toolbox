import React, { useState } from 'react';
import { Upload, Download, ListOrdered, Check, AlertCircle } from 'lucide-react';

interface PostmanItem {
  name: string;
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
  [key: string]: unknown;
}

const VAILD_TEST_TYPE = ['Functional Test', 'Force Error Test', 'Boundary Test'];
const VAILD_TESTCASE_CONDITION = ':';
const TEST_TYPE_PREFIX: Record<string, string> = {
  "Functional Test": "FN",
  "Force Error Test": "FET",
  "Boundary Test": "BT"
};
const IGNORE_TESTCASE_1 = 'PRE';
const IGNORE_TESTCASE_2 = 'CHECK';
const IGNORE_SPEC = ["Init"];

const PostmanResequencer: React.FC = () => {
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

  const resequenceItems = (items: PostmanItem[]) => {
    for (const spec of items) {
      if (IGNORE_SPEC.includes(spec.name)) {
        continue;
      }

      if (spec.item && Array.isArray(spec.item)) {
        for (const testType of spec.item) {
          if (VAILD_TEST_TYPE.includes(testType.name) && testType.item && Array.isArray(testType.item)) {
            let index = 1;
            const prefix = TEST_TYPE_PREFIX[testType.name];
            
            for (const testCase of testType.item) {
              const oldName = testCase.name;
              
              if (oldName.startsWith(IGNORE_TESTCASE_1) || oldName.startsWith(IGNORE_TESTCASE_2)) {
                continue;
              }
              
              if (oldName.includes(VAILD_TESTCASE_CONDITION)) {
                const newIndex = `${prefix}_${index.toString().padStart(2, '0')}`;
                const parts = oldName.split(VAILD_TESTCASE_CONDITION);
                // Remove the first part (existing index) and join the rest
                const content = parts.slice(1).join(VAILD_TESTCASE_CONDITION);
                testCase.name = `${newIndex}:${content}`;
                index++;
              }
            }
          }
        }
      }
    }
  };

  const processCollection = () => {
    if (!collection) return;

    setIsProcessing(true);
    setError(null);

    // Deep clone to avoid mutating state directly
    const newCollection = JSON.parse(JSON.stringify(collection)) as PostmanCollection;

    try {
      resequenceItems(newCollection.item);
      setCollection(newCollection);
      setIsDone(true);
    } catch (e) {
      setError('An error occurred during resequencing.');
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCollection = () => {
    if (!collection) return;

    const blob = new Blob([JSON.stringify(collection, null, 4)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName ? `resequenced-${fileName}` : 'resequenced-collection.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Postman Name Resequencer</h2>
        <ListOrdered className="text-indigo-500" size={32} />
      </div>

      <p className="text-slate-600">
        Automatically resequence Postman request names within Functional, Force Error, and Boundary test folders.
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
            id="resequencer-upload"
            className="hidden"
            accept=".json,.postman_collection"
            onChange={handleFileUpload}
          />
          <label htmlFor="resequencer-upload" className="cursor-pointer flex flex-col items-center gap-3">
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

        {collection && !isDone && (
          <button
            onClick={processCollection}
            disabled={isProcessing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Resequence Names'}
          </button>
        )}

        {isDone && (
          <div className="space-y-4">
            <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3 border border-green-100">
              <Check size={20} />
              <span className="text-sm font-medium">Successfully resequenced!</span>
            </div>
            <button
              onClick={downloadCollection}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download size={20} /> Download Resequenced Collection
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
          <li>Identifies test folders: <code className="bg-slate-200 px-1 rounded">Functional Test</code>, <code className="bg-slate-200 px-1 rounded">Force Error Test</code>, and <code className="bg-slate-200 px-1 rounded">Boundary Test</code>.</li>
          <li>Applies prefixes: <code className="bg-slate-200 px-1 rounded">FN_XX:</code>, <code className="bg-slate-200 px-1 rounded">FET_XX:</code>, or <code className="bg-slate-200 px-1 rounded">BT_XX:</code>.</li>
          <li>Resets numbering for each test type folder.</li>
          <li>Ignores folders named <code className="bg-slate-200 px-1 rounded">Init</code> and requests starting with <code className="bg-slate-200 px-1 rounded">PRE</code> or <code className="bg-slate-200 px-1 rounded">CHECK</code>.</li>
        </ul>
      </div>
    </div>
  );
};

export default PostmanResequencer;
