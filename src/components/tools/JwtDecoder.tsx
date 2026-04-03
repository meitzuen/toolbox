import React, { useState, useMemo } from 'react';

const JwtDecoder: React.FC = () => {
  const [input, setInput] = useState('');
  const decoded = useMemo(() => {
    try {
      const parts = input.split('.');
      if (parts.length < 2) return null;
      // Decode base64 handling padding
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.stringify(JSON.parse(window.atob(base64)), null, 2);
    } catch { return 'Invalid JWT Payload'; }
  }, [input]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold">JWT Decoder</h2>
      <textarea 
        className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
        placeholder="Paste your JWT here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto min-h-[200px] text-sm leading-relaxed">
        {input ? decoded : "// Decoded payload will appear here..."}
      </pre>
    </div>
  );
};

export default JwtDecoder;
