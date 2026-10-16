import React, { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface JwtEncoderProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const ALGS = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' } as const;
type Alg = keyof typeof ALGS;

const b64url = (bytes: Uint8Array) =>
  btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = (s: string) => new TextEncoder().encode(s);

const parseObj = (s: string): Record<string, unknown> => {
  const v = JSON.parse(s);
  if (v === null || typeof v !== 'object' || Array.isArray(v)) throw new Error('must be a JSON object');
  return v;
};

const DEFAULT_PAYLOAD = JSON.stringify({ sub: '1234567890', name: 'John Doe', iat: 1516239022 }, null, 2);

const JwtEncoder: React.FC<JwtEncoderProps> = ({ onCopy, copyStatus }) => {
  const [alg, setAlg] = useState<Alg>('HS256');
  const [extraHeader, setExtraHeader] = useState('{\n  "typ": "JWT"\n}');
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [secret, setSecret] = useState('your-256-bit-secret');
  const [result, setResult] = useState<{ key: string; token: string; error: string }>({ key: '', token: '', error: '' });

  const key = JSON.stringify([alg, extraHeader, payload, secret]);

  useEffect(() => {
    let cancelled = false;
    const done = (token: string, error: string) => { if (!cancelled) setResult({ key, token, error }); };
    (async () => {
      let header: Record<string, unknown>, body: Record<string, unknown>;
      try { header = parseObj(extraHeader); } catch (e) { return done('', `Header: ${e instanceof Error ? e.message : 'invalid JSON'}`); }
      try { body = parseObj(payload); } catch (e) { return done('', `Payload: ${e instanceof Error ? e.message : 'invalid JSON'}`); }
      const head = b64url(enc(JSON.stringify({ alg, ...Object.fromEntries(Object.entries(header).filter(([k]) => k !== 'alg')) })));
      const data = `${head}.${b64url(enc(JSON.stringify(body)))}`;
      try {
        const k = await crypto.subtle.importKey('raw', enc(secret), { name: 'HMAC', hash: ALGS[alg] }, false, ['sign']);
        const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc(data)));
        done(`${data}.${b64url(sig)}`, '');
      } catch {
        done('', 'Signing failed');
      }
    })();
    return () => { cancelled = true; };
  }, [key, alg, extraHeader, payload, secret]);

  const current = result.key === key ? result : null;

  const patchPayload = (patch: Record<string, unknown>) => {
    try { setPayload(JSON.stringify({ ...parseObj(payload), ...patch }, null, 2)); } catch { /* payload invalid — leave as is */ }
  };
  const now = () => Math.floor(Date.now() / 1000);

  const area = 'w-full p-4 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white';
  const label = 'text-xs font-bold text-slate-400 uppercase tracking-wider';
  const quick = 'px-2.5 py-1 rounded-md border border-slate-200 text-[11px] text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all';

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">JWT Encoder</h2>
      <p className="text-slate-500 text-sm">Create HMAC-signed (HS256 / HS384 / HS512) JSON Web Tokens locally. The secret never leaves your browser — still, don't use production secrets in any web tool.</p>

      <div className="flex items-center gap-2">
        <span className={label}>Algorithm</span>
        {(Object.keys(ALGS) as Alg[]).map((a) => (
          <button key={a} onClick={() => setAlg(a)} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${alg === a ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>{a}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={label}>Header (alg is set for you)</label>
          <textarea className={`${area} h-40`} value={extraHeader} onChange={(e) => setExtraHeader(e.target.value)} spellCheck={false} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={label}>Payload</label>
            <div className="flex gap-1.5">
              <button className={quick} onClick={() => patchPayload({ iat: now() })}>iat = now</button>
              <button className={quick} onClick={() => patchPayload({ exp: now() + 3600 })}>exp +1h</button>
              <button className={quick} onClick={() => patchPayload({ exp: now() + 86400 })}>exp +1d</button>
            </div>
          </div>
          <textarea className={`${area} h-40`} value={payload} onChange={(e) => setPayload(e.target.value)} spellCheck={false} />
        </div>
      </div>

      <div className="space-y-2">
        <label className={label}>Secret</label>
        <input value={secret} onChange={(e) => setSecret(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white" spellCheck={false} />
      </div>

      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Encoded Token</span>
          <button
            onClick={() => current?.token && onCopy(current.token, 'jwt-encode')}
            disabled={!current?.token}
            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${copyStatus === 'jwt-encode' ? 'bg-green-500/10 text-green-400' : 'text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30'}`}
          >
            {copyStatus === 'jwt-encode' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
        <div className={`min-h-[80px] p-4 font-mono text-sm break-all leading-relaxed ${current?.error ? 'text-red-400' : ''}`}>
          {current?.error ? current.error : current?.token ? (() => {
            const [h, p, s] = current.token.split('.');
            return <><span className="text-rose-400">{h}</span>.<span className="text-violet-400">{p}</span>.<span className="text-cyan-400">{s}</span></>;
          })() : <span className="text-slate-500 italic">Signing…</span>}
        </div>
      </div>
    </div>
  );
};

export default JwtEncoder;
