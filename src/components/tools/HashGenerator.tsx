import React, { useState, useEffect } from 'react';
import { Copy, Check, FileUp, X } from 'lucide-react';

interface HashGeneratorProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;
type Algorithm = typeof ALGORITHMS[number];
type Encoding = 'hex' | 'base64';
type Source = 'text' | 'file';

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
const toBase64 = (buf: ArrayBuffer) =>
  btoa(Array.from(new Uint8Array(buf), b => String.fromCharCode(b)).join(''));

async function digest(algo: Algorithm, data: ArrayBuffer | Uint8Array<ArrayBuffer>, secret: string): Promise<ArrayBuffer> {
  if (!secret) return crypto.subtle.digest(algo, data);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: algo }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, data);
}

const HashGenerator: React.FC<HashGeneratorProps> = ({ onCopy, copyStatus }) => {
  const [source, setSource] = useState<Source>('text');
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [secret, setSecret] = useState('');
  const [encoding, setEncoding] = useState<Encoding>('hex');
  const [result, setResult] = useState<{ key: string; hashes: Partial<Record<Algorithm, string>> }>({ key: '', hashes: {} });

  const hasInput = source === 'text' ? input.trim() !== '' : file !== null;
  const fileId = file ? `${file.name}:${file.size}:${file.lastModified}` : '';
  const key = JSON.stringify([source, source === 'text' ? input : fileId, secret, encoding]);
  const computing = hasInput && result.key !== key;
  const hashes = hasInput && !computing ? result.hashes : {};

  useEffect(() => {
    if (!hasInput) return;
    let cancelled = false;
    const compute = async () => {
      const data = source === 'text' ? new TextEncoder().encode(input) : await file!.arrayBuffer();
      const results: Partial<Record<Algorithm, string>> = {};
      for (const algo of ALGORITHMS) {
        const buf = await digest(algo, data, secret);
        results[algo] = encoding === 'hex' ? toHex(buf) : toBase64(buf);
      }
      if (!cancelled) setResult({ key, hashes: results });
    };
    compute();
    return () => { cancelled = true; };
  }, [key, source, input, file, secret, encoding, hasInput]);

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${active ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`;

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">Hash &amp; HMAC Generator</h2>
      <p className="text-slate-500 text-sm">Hash text or a file with the Web Crypto API. Enter a secret key to compute HMAC instead. Everything stays in your browser.</p>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setSource('text')} className={chip(source === 'text')}>Text</button>
        <button onClick={() => setSource('file')} className={chip(source === 'file')}>File</button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setEncoding('hex')} className={chip(encoding === 'hex')}>Hex</button>
          <button onClick={() => setEncoding('base64')} className={chip(encoding === 'base64')}>Base64</button>
        </div>
      </div>

      {source === 'text' ? (
        <textarea
          className="w-full h-32 p-4 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
          placeholder="Enter text to hash..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 h-32 border-2 border-dashed border-slate-200 rounded-xl bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all cursor-pointer">
          <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          {file ? (
            <span className="flex items-center gap-2 text-sm text-slate-700 font-mono">
              {file.name} <span className="text-slate-400">({file.size.toLocaleString()} bytes)</span>
              <button
                onClick={e => { e.preventDefault(); setFile(null); }}
                className="p-1 text-slate-300 hover:text-red-500"
                title="Remove file"
              >
                <X size={14} />
              </button>
            </span>
          ) : (
            <>
              <FileUp size={22} />
              <span className="text-sm">Click to choose a file</span>
            </>
          )}
        </label>
      )}

      <input
        value={secret}
        onChange={e => setSecret(e.target.value)}
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
        placeholder="HMAC secret key (optional — leave empty for a plain hash)"
        spellCheck={false}
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
              <div className="w-28 shrink-0">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{secret ? `HMAC-${algo}` : algo}</span>
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
