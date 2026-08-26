import React, { useState, useMemo } from 'react';
import { FileJson, Copy, Check, List } from 'lucide-react';

interface JsonFieldExtractorProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const JsonFieldExtractor: React.FC<JsonFieldExtractorProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Tracks how the input was shaped, so the output can mirror it:
  // 'array' when the input parsed as a single JSON value (object or array),
  // 'ndjson' when it had to be parsed line-by-line.
  const parseResult = useMemo(() => {
    if (!input.trim()) return { data: [] as unknown[], format: 'array' as const };
    const trimmed = input.trim();

    // Try parsing as a single JSON (Object or Array)
    try {
      const data = JSON.parse(trimmed);
      return { data: Array.isArray(data) ? data : [data], format: 'array' as const };
    } catch (e) {
      // If it fails, try parsing as newline-separated JSON objects
      try {
        const data = trimmed
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => JSON.parse(line));
        return { data, format: 'ndjson' as const };
      } catch (e2) {
        return { data: null, format: null };
      }
    }
  }, [input]);

  const parsedData = parseResult.data;
  const inputFormat = parseResult.format;

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

  const toggleKey = (key: string) => {
    setSelectedKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // The extracted values themselves (kept as real JS values, not pre-stringified),
  // so the final text formatting can decide how to render them.
  const resultValues = useMemo(() => {
    if (selectedKeys.length === 0 || !parsedData) return [];

    if (selectedKeys.length === 1) {
      const key = selectedKeys[0];
      return parsedData
        .filter(item => item && typeof item === 'object' && item.hasOwnProperty(key))
        .map(item => item[key]);
    }

    // Multiple keys selected: extract an object containing only the selected keys
    return parsedData
      .filter(item => item && typeof item === 'object')
      .map(item => {
        const extracted: Record<string, unknown> = {};
        selectedKeys.forEach(key => {
          if (item.hasOwnProperty(key)) {
            extracted[key] = item[key];
          }
        });
        return extracted;
      });
  }, [parsedData, selectedKeys]);

  // When the input was a JSON array, mirror that shape in the output (a real JSON array).
  // When the input was newline-separated JSON, keep the original line-by-line behavior.
  const outputText = useMemo(() => {
    if (resultValues.length === 0) return '';

    if (inputFormat === 'array') {
      return JSON.stringify(resultValues, null, 2);
    }

    if (selectedKeys.length === 1) {
      return resultValues
        .map(val => (val && typeof val === 'object' ? JSON.stringify(val) : String(val)))
        .join('\n');
    }
    return resultValues.map(val => JSON.stringify(val)).join('\n');
  }, [resultValues, inputFormat, selectedKeys]);

  const handleCopyResults = () => {
    if (outputText) {
      onCopy(outputText, 'json-extractor');
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
              setSelectedKeys([]);
            }}
          />
          {input && parsedData === null && (
            <p className="text-rose-500 text-xs font-medium px-1">Invalid JSON format</p>
          )}
        </div>

        {availableKeys.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Select Field(s) to Extract
              </label>
              {selectedKeys.length > 0 && (
                <button
                  onClick={() => setSelectedKeys([])}
                  className="text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  Clear ({selectedKeys.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableKeys.map(key => (
                <button
                  key={key}
                  onClick={() => toggleKey(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    selectedKeys.includes(key)
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
                {resultValues.length} {resultValues.length === 1 ? 'Value' : 'Values'} Extracted
              </span>
            </div>
            <button
              onClick={handleCopyResults}
              disabled={resultValues.length === 0}
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
            {outputText ? (
              outputText
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 italic">
                 <p>Paste JSON and select field(s) to see extracted values</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonFieldExtractor;
