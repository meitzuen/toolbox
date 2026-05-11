import React, { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';

const JwtDecoder: React.FC = () => {
  const [input, setInput] = useState('');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const decoded = useMemo(() => {
    const raw = input.trim();
    if (!raw) return null;
    try {
      const parts = raw.split('.');
      if (parts.length < 2) return { error: 'Not a valid JWT — expected 3 dot-separated parts' };
      const b64 = (s: string) => {
        const padded = s.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(padded));
      };
      const header = b64(parts[0]);
      const payload = b64(parts[1]);
      const now = Math.floor(Date.now() / 1000);
      const exp = typeof payload.exp === 'number' ? payload.exp : undefined;
      const iat = typeof payload.iat === 'number' ? payload.iat : undefined;
      const nbf = typeof payload.nbf === 'number' ? payload.nbf : undefined;
      const expStatus: 'valid' | 'expired' | undefined = exp !== undefined
        ? (exp < now ? 'expired' : 'valid')
        : undefined;
      return { header, payload, exp, iat, nbf, expStatus };
    } catch {
      return { error: 'Invalid JWT — could not decode payload' };
    }
  }, [input]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold">JWT Decoder</h2>

      <textarea
        className="w-full h-28 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono text-sm resize-none"
        placeholder="Paste your JWT here..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      {decoded?.error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {decoded.error}
        </div>
      )}

      {decoded && !decoded.error && (
        <div className="space-y-4">
          {decoded.expStatus && (
            <div className={`px-4 py-3 rounded-xl flex items-center gap-3 border text-sm font-medium ${
              decoded.expStatus === 'valid'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                decoded.expStatus === 'valid' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span>
                {decoded.expStatus === 'valid' ? 'Token valid' : 'Token expired'}
                {' — '}
                {decoded.expStatus === 'valid' ? 'expires' : 'expired'}{' '}
                {new Date(decoded.exp! * 1000).toLocaleString()}
                {decoded.iat && (
                  <span className="ml-2 opacity-70">
                    · issued {new Date(decoded.iat * 1000).toLocaleString()}
                  </span>
                )}
                {decoded.nbf && decoded.nbf > Math.floor(Date.now() / 1000) && (
                  <span className="ml-2 opacity-70">
                    · not valid before {new Date(decoded.nbf * 1000).toLocaleString()}
                  </span>
                )}
              </span>
            </div>
          )}

          {[
            { title: 'Header', data: decoded.header, id: 'jwt-header' },
            { title: 'Payload', data: decoded.payload, id: 'jwt-payload' },
          ].map(({ title, data, id }) => {
            const text = JSON.stringify(data, null, 2);
            return (
              <div key={id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</label>
                  <button
                    onClick={() => handleCopy(text, id)}
                    className={`p-1.5 rounded-lg flex items-center gap-1 text-xs transition-all ${
                      copyStatus === id
                        ? 'text-green-500 bg-green-50'
                        : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    {copyStatus === id ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-xs leading-relaxed min-h-[80px]">
                  {text}
                </pre>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JwtDecoder;
