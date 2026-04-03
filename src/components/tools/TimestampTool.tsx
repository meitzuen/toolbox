import React, { useState, useMemo } from 'react';

const TimestampTool: React.FC = () => {
  const [ts, setTs] = useState<string>(Math.floor(Date.now() / 1000).toString());
  const dateStr = useMemo(() => {
    const val = parseInt(ts);
    if (isNaN(val)) return 'Invalid Date';
    return new Date(val * 1000).toLocaleString();
  }, [ts]);

  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-2xl font-bold">Timestamp Converter</h2>
      <div className="flex gap-4">
        <input 
          type="number" 
          value={ts} 
          onChange={e => setTs(e.target.value)} 
          className="flex-1 p-3 border rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button onClick={() => setTs(Math.floor(Date.now() / 1000).toString())} className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Current Now</button>
      </div>
      <div className="p-8 bg-indigo-600 rounded-2xl text-center shadow-xl shadow-indigo-100">
        <div className="text-indigo-200 text-xs uppercase tracking-[0.2em] font-bold">Local Date Time</div>
        <div className="text-3xl font-mono mt-2 text-white">{dateStr}</div>
      </div>
    </div>
  );
};

export default TimestampTool;
