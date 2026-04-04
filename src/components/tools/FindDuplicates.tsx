import React, { useState, useMemo } from 'react';
import { Copy, Check, Trash2, ListFilter } from 'lucide-react';

const ResultBox: React.FC<{ 
  title: string; 
  data: string[]; 
  color: 'indigo' | 'amber';
  onCopy: (text: string) => void;
  copyStatus: boolean;
}> = ({ title, data, color, onCopy, copyStatus }) => (
  <div className={`p-4 rounded-xl border ${
    color === 'indigo' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-amber-50/50 border-amber-100'
  } flex flex-col h-full`}>
    <div className="flex items-center justify-between mb-3">
      <h4 className={`font-semibold text-sm ${
        color === 'indigo' ? 'text-indigo-900' : 'text-amber-900'
      }`}>{title} ({data.length})</h4>
      <button 
        onClick={() => onCopy(data.join('\n'))}
        disabled={data.length === 0}
        className={`p-1.5 rounded-md transition-colors ${
          color === 'indigo' 
          ? 'hover:bg-indigo-100 text-indigo-600' 
          : 'hover:bg-amber-100 text-amber-600'
        } disabled:opacity-30`}
      >
        {copyStatus ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
    <div className="flex-1 bg-white/60 rounded-lg p-3 font-mono text-xs max-h-48 overflow-y-auto border border-white/40 shadow-sm">
      {data.length > 0 ? (
        <div className="whitespace-pre-wrap break-all leading-relaxed text-slate-600">
          {data.join('\n')}
        </div>
      ) : (
        <span className="text-slate-400 italic">No items found</span>
      )}
    </div>
  </div>
);

const FindDuplicates: React.FC = () => {
  const [input, setInput] = useState('');
  const [copyState, setCopyState] = useState<'unique' | 'duplicates' | null>(null);

  const results = useMemo(() => {
    // Support both comma and newline separation
    const items = input
      .replace(/,/g, '\n')
      .split('\n')
      .map(i => i.trim())
      .filter(Boolean);

    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });

    return {
      unique: Object.keys(counts),
      duplicates: Object.entries(counts)
        .filter(([_, count]) => count > 1)
        .map(([item]) => item)
    };
  }, [input]);

  const handleCopy = (text: string, type: 'unique' | 'duplicates') => {
    navigator.clipboard.writeText(text);
    setCopyState(type);
    setTimeout(() => setCopyState(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <ListFilter size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Duplicate Checker</h2>
          <p className="text-slate-500 text-sm">Find and remove duplicate values from your lists</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-slate-700">Input List</label>
          <button 
            onClick={() => setInput('')}
            className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
        <textarea 
          placeholder="Paste your items here (comma or newline separated)...&#10;Example: 1, 2, 3, 3, 4" 
          className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none" 
          value={input}
          onChange={e => setInput(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResultBox 
          title="Remove Duplicates" 
          data={results.unique} 
          color="indigo" 
          onCopy={(text) => handleCopy(text, 'unique')}
          copyStatus={copyState === 'unique'}
        />
        <ResultBox 
          title="Find Duplicates" 
          data={results.duplicates} 
          color="amber" 
          onCopy={(text) => handleCopy(text, 'duplicates')}
          copyStatus={copyState === 'duplicates'}
        />
      </div>
    </div>
  );
};

export default FindDuplicates;
