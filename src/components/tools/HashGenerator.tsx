import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

interface HashGeneratorProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;
type Algorithm = typeof ALGORITHMS[number];

const HashGenerator: React.FC<HashGeneratorProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<Partial<Record<Algorithm, string>>>({});
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setHashes({});
      return;
    }
    setComputing(true);
    const compute = async () => {
      const data = new TextEncoder().encode(input);
      const results: Partial<Record<Algorithm, string>> = {};
      for (const algo of ALGORITHMS) {
        const buf = await crypto.subtle.digest(algo, data);
        results[algo] = Array.from(new Uint8Array(buf))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      }
      setHashes(results);
      setComputing(false);
    };
    compute();
  }, [input]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">Hash Generator</h2>
      <p className="text-slate-500 text-sm">Generate cryptographic hashes of any text using the Web Crypto API.</p>

      <textarea
        className="w-full h-32 p-4 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
        placeholder="Enter text to hash..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <div className="space-y-3">
        {ALGORITHMS.map(algo => {
          const hash = hashes[algo];
          const copyId = `hash-${algo}`;
          return (
            <div
              key={algo}
              className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-center hover:border-indigo-200 transition-colors"
            >
              <div className="w-20 shrink-0">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{algo}</span>
              </div>
              <code className="flex-1 text-xs text-slate-600 font-mono break-all leading-relaxed min-h-[1rem]">
                {computing ? (
                  <span className="text-slate-300 animate-pulse">computing...</span>
                ) : hash ? (
                  hash
                ) : (
                  <span className="text-slate-300 italic">—</span>
                )}
              </code>
              <button
                onClick={() => hash && onCopy(hash, copyId)}
                disabled={!hash}
                className={`shrink-0 p-1.5 rounded-lg transition-all ${
                  copyStatus === copyId
                    ? 'text-green-500'
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30'
                }`}
              >
                {copyStatus === copyId ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HashGenerator;
