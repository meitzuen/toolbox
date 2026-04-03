import React, { useState, useMemo } from 'react';

const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const formatted = useMemo(() => {
    if (!input) return '';
    try {
      return JSON.stringify(JSON.parse(input), null, 2);
    } catch { return 'Invalid JSON format'; }
  }, [input]);

  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-2xl font-bold">JSON Formatter</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea className="h-96 p-3 border rounded-lg font-mono text-xs" placeholder="Paste minified JSON..." onChange={e => setInput(e.target.value)} />
        <pre className="h-96 p-3 bg-slate-900 text-blue-300 rounded-lg overflow-auto text-xs leading-relaxed border border-slate-800">
          {formatted || "// Formatted JSON will appear here"}
        </pre>
      </div>
    </div>
  );
};

export default JsonFormatter;
