import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Copy, Check, Hash, Link2 } from 'lucide-react';

interface UrlCombinationGeneratorProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

interface ListEntry {
  content: string;
  separator: string;
}

const SEPARATORS = ["/", "?", "&", "=", "-", "."];

const UrlCombinationGenerator: React.FC<UrlCombinationGeneratorProps> = ({ onCopy, copyStatus }) => {
  const [lists, setLists] = useState<ListEntry[]>([
    { content: '', separator: '/' },
    { content: '', separator: '/' }
  ]);

  const addList = () => setLists([...lists, { content: '', separator: '/' }]);
  const removeList = (index: number) => {
    if (lists.length > 1) {
      setLists(lists.filter((_, i) => i !== index));
    }
  };

  const updateList = (index: number, content: string) => {
    const nextLists = [...lists];
    nextLists[index] = { ...nextLists[index], content };
    setLists(nextLists);
  };

  const updateSeparator = (index: number, separator: string) => {
    const nextLists = [...lists];
    nextLists[index] = { ...nextLists[index], separator };
    setLists(nextLists);
  };

  const combinations = useMemo(() => {
    const activeLists = lists
      .map((l, index) => ({
        items: l.content.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0),
        separator: l.separator,
        originalIndex: index
      }))
      .filter(l => l.items.length > 0);

    if (activeLists.length === 0) return [];

    const cartesian = (...arrays: string[][]): string[][] => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap(d => curr.map(e => [...d, e]));
      }, [[]] as string[][]);
    };

    const inputItems = activeLists.map(l => l.items);
    return cartesian(...inputItems).map(combo => {
      return combo.reduce((acc, item, idx) => {
        const isLast = idx === combo.length - 1;
        return acc + item + (isLast ? '' : activeLists[idx].separator);
      }, '');
    });
  }, [lists]);

  const handleCopyResults = () => {
    if (combinations.length > 0) {
      onCopy(combinations.join('\n'), 'url-combinations');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
           <Link2 className="text-indigo-600" /> URL Combination Generator
        </h2>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={addList}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus size={16} /> Add List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lists.map((list, idx) => (
          <div key={idx} className="relative group flex flex-col gap-2">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">
                  {idx + 1}
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">List {idx + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Sep:</span>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                  {SEPARATORS.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateSeparator(idx, s)}
                      className={`w-6 h-6 flex items-center justify-center rounded-md transition-all text-[10px] font-bold ${
                        list.separator === s ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {lists.length > 1 && (
                  <button
                    onClick={() => removeList(idx)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all ml-2"
                    title="Remove list"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <textarea
              className="w-full h-40 p-4 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white shadow-sm group-hover:border-slate-300"
              placeholder={`Enter items for List ${idx + 1} (one per line)...`}
              value={list.content}
              onChange={(e) => updateList(idx, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800">
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg">
              <Hash size={14} className="text-indigo-400" />
            </div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              {combinations.length} {combinations.length === 1 ? 'Result' : 'Results'}
            </span>
          </div>
          <button
            onClick={handleCopyResults}
            disabled={combinations.length === 0}
            className={`transition-all p-2 rounded-lg flex items-center gap-2 text-xs font-medium ${
              copyStatus === 'url-combinations' 
                ? 'bg-green-500/10 text-green-400' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-50'
            }`}
          >
            {copyStatus === 'url-combinations' ? (
              <><Check size={14} /> Copied to Clipboard</>
            ) : (
              <><Copy size={14} /> Copy All Results</>
            )}
          </button>
        </div>
        <div className="h-64 p-4 font-mono text-[11px] text-blue-300/90 overflow-auto whitespace-pre leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {combinations.length > 0 ? (
            combinations.join('\n')
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 italic">
               <p>Enter items in the lists above to generate combinations</p>
               <p className="text-[10px] mt-1">Example: A, B in List 1 and 1, 2 in List 2 → A/1, A/2, B/1, B/2</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UrlCombinationGenerator;
