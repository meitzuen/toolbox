import React, { useState, useMemo } from 'react';
import { FileJson, Copy, Check, List } from 'lucide-react';

interface JsonFieldExtractorProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const JsonFieldExtractor: React.FC<JsonFieldExtractorProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const parsedData = useMemo(() => {
    if (!input.trim()) return [];
    const trimmed = input.trim();
    
    // Try parsing as a single JSON (Object or Array)
    try {
      const data = JSON.parse(trimmed);
      return Array.isArray(data) ? data : [data];
    } catch (e) {
      // If it fails, try parsing as newline-separated JSON objects
      try {
        return trimmed
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => JSON.parse(line));
      } catch (e2) {
        return null;
      }
    }
  }, [input]);

  const availableKeys = useMemo(() => {
    if (!parsedData || !Array.isArray(parsedData)) return [];
    const keys = new Set<string>();
    parsedData.forEach(item => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        Object.keys(item).forEach(k => keys.add(k));
      }
    });
    return Array.from(keys).sort();
  }, [parsedData]);

  const results = useMemo(() => {
    if (!selectedKey || !parsedData) return [];
    return parsedData
      .map(item => {
        if (item && typeof item === 'object' && item.hasOwnProperty(selectedKey)) {
          const val = item[selectedKey];
          return typeof val === 'object' ? JSON.stringify(val) : String(val);
        }
        return null;
      })
      .filter(val => val !== null);
  }, [parsedData, selectedKey]);

  const handleCopyResults = () => {
    if (results.length > 0) {
      onCopy(results.join('\n'), 'json-extractor');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
           <FileJson className="text-indigo-600" /> JSON Field Extractor
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Input JSON (Array or Newline-separated Objects)
          </label>
          <textarea
            className="w-full h-48 p-4 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white shadow-sm"
            placeholder={'[\n  {"id": 1, "name": "John"},\n  {"id": 2, "name": "Jane"}\n]'}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSelectedKey(null);
            }}
          />
          {input && parsedData === null && (
            <p className="text-rose-500 text-xs font-medium px-1">Invalid JSON format</p>
          )}
        </div>

        {availableKeys.length > 0 && (
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Select Field to Extract
            </label>
            <div className="flex flex-wrap gap-2">
              {availableKeys.map(key => (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    selectedKey === key
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800">
          <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                <List size={14} className="text-indigo-400" />
              </div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                {results.length} {results.length === 1 ? 'Value' : 'Values'} Extracted
              </span>
            </div>
            <button
              onClick={handleCopyResults}
              disabled={results.length === 0}
              className={`transition-all p-2 rounded-lg flex items-center gap-2 text-xs font-medium ${
                copyStatus === 'json-extractor' 
                  ? 'bg-green-500/10 text-green-400' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-50'
              }`}
            >
              {copyStatus === 'json-extractor' ? (
                <><Check size={14} /> Copied to Clipboard</>
              ) : (
                <><Copy size={14} /> Copy All Results</>
              )}
            </button>
          </div>
          <div className="h-48 p-4 font-mono text-[11px] text-blue-300/90 overflow-auto whitespace-pre leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {results.length > 0 ? (
              results.join('\n')
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 italic">
                 <p>Paste JSON and select a key to see extracted values</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonFieldExtractor;
