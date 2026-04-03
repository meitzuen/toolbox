import React, { useState } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';

interface UuidGeneratorProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const UuidGenerator: React.FC<UuidGeneratorProps> = ({ onCopy, copyStatus }) => {
  const [uuids, setUuids] = useState<string[]>([]);
  const generate = () => setUuids(Array.from({ length: 5 }, () => crypto.randomUUID()));

  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-2xl font-bold">UUID v4 Generator</h2>
      <button onClick={generate} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
        <RefreshCw size={18} /> Generate 5 UUIDs
      </button>
      <div className="space-y-2 mt-4">
        {uuids.map((u, i) => (
          <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center font-mono hover:border-indigo-300 transition-colors group">
            <span className="text-slate-600">{u}</span>
            <button onClick={() => onCopy(u, `uuid-${i}`)} className="text-slate-400 hover:text-indigo-600 p-1">
              {copyStatus === `uuid-${i}` ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UuidGenerator;
