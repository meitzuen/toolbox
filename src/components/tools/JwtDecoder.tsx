<<<<<<< HEAD
import React, { useState, useMemo, useCallback } from 'react';
import { Copy, Check, ShieldCheck, ShieldX, Shield, AlertCircle, RefreshCw } from 'lucide-react';

// ─── base64url helpers ────────────────────────────────────────────────────

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, '=');
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

function b64urlDecodeJson(s: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));
}

// ─── JSON syntax highlighter (inline styles — safe from Tailwind purge) ──

function highlight(json: string): string {
  const esc = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (_m, str, colon, kw, num) => {
      if (str && colon) return `<span style="color:#7dd3fc">${str}</span>${colon}`;   // key – sky
      if (str)          return `<span style="color:#fbbf24">${str}</span>`;            // string – amber
      if (kw === 'true' || kw === 'false') return `<span style="color:#f87171">${kw}</span>`; // bool – rose
      if (kw === 'null')  return `<span style="color:#94a3b8">${kw}</span>`;           // null – slate
      if (num)            return `<span style="color:#34d399">${num}</span>`;           // number – emerald
      return _m;
    },
  );
}

// ─── signature verification ───────────────────────────────────────────────

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
}

async function verifySignature(
  alg: string,
  headerB64: string,
  payloadB64: string,
  sigB64: string,
  keyInput: string,
): Promise<boolean | 'unsupported'> {
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig  = b64urlToBytes(sigB64);

  if (alg === 'HS256' || alg === 'HS384' || alg === 'HS512') {
    const hash = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' }[alg]!;
    const ck = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(keyInput),
      { name: 'HMAC', hash }, false, ['verify'],
    );
    return crypto.subtle.verify('HMAC', ck, sig, data);
  }

  if (alg === 'RS256' || alg === 'RS384' || alg === 'RS512') {
    const hash = { RS256: 'SHA-256', RS384: 'SHA-384', RS512: 'SHA-512' }[alg]!;
    const ck = await crypto.subtle.importKey(
      'spki', pemToDer(keyInput),
      { name: 'RSASSA-PKCS1-v1_5', hash }, false, ['verify'],
    );
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5', ck, sig, data);
  }

  if (alg === 'ES256' || alg === 'ES384' || alg === 'ES512') {
    const curve = { ES256: 'P-256', ES384: 'P-384', ES512: 'P-521' }[alg]!;
    const hash  = { ES256: 'SHA-256', ES384: 'SHA-384', ES512: 'SHA-512' }[alg]!;
    const ck = await crypto.subtle.importKey(
      'spki', pemToDer(keyInput),
      { name: 'ECDSA', namedCurve: curve }, false, ['verify'],
    );
    return crypto.subtle.verify({ name: 'ECDSA', hash }, ck, sig, data);
  }

  if (alg === 'PS256' || alg === 'PS384' || alg === 'PS512') {
    const hash       = { PS256: 'SHA-256', PS384: 'SHA-384', PS512: 'SHA-512' }[alg]!;
    const saltLength = { PS256: 32,        PS384: 48,        PS512: 64        }[alg]!;
    const ck = await crypto.subtle.importKey(
      'spki', pemToDer(keyInput),
      { name: 'RSA-PSS', hash }, false, ['verify'],
    );
    return crypto.subtle.verify({ name: 'RSA-PSS', saltLength }, ck, sig, data);
  }

  return 'unsupported';
}

// ─── constants ────────────────────────────────────────────────────────────

const ALG_LABELS: Record<string, string> = {
  HS256: 'HMAC SHA-256', HS384: 'HMAC SHA-384', HS512: 'HMAC SHA-512',
  RS256: 'RSA SHA-256',  RS384: 'RSA SHA-384',  RS512: 'RSA SHA-512',
  ES256: 'ECDSA P-256',  ES384: 'ECDSA P-384',  ES512: 'ECDSA P-521',
  PS256: 'RSA-PSS SHA-256', PS384: 'RSA-PSS SHA-384', PS512: 'RSA-PSS SHA-512',
};

const TIMESTAMP_CLAIMS = ['exp', 'iat', 'nbf'] as const;

type SigStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'unsupported' | 'error';

// ─── sub-components ───────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
      {children}
    </p>
  );
}

function CopyButton({ text, id, copyStatus, onCopy }: {
  text: string; id: string; copyStatus: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const active = copyStatus === id;
  return (
    <button
      onClick={() => onCopy(text, id)}
      className={`p-1.5 rounded-lg flex items-center gap-1 text-xs transition-all ${
        active ? 'text-green-500 bg-green-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
      }`}
    >
      {active ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  );
}

function SigStatusBadge({ status }: { status: SigStatus }) {
  if (status === 'idle') return null;
  const config = {
    checking:    { icon: <RefreshCw size={13} className="animate-spin" />, label: 'Verifying…',          cls: 'bg-slate-100 text-slate-500 border-slate-200' },
    valid:       { icon: <ShieldCheck size={13} />,                        label: 'Signature Verified',   cls: 'bg-green-50 text-green-700 border-green-200' },
    invalid:     { icon: <ShieldX size={13} />,                            label: 'Invalid Signature',    cls: 'bg-red-50 text-red-600 border-red-200' },
    unsupported: { icon: <Shield size={13} />,                             label: 'Algorithm not supported', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    error:       { icon: <AlertCircle size={13} />,                        label: 'Verification error',   cls: 'bg-red-50 text-red-600 border-red-200' },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.cls}`}>
      {config.icon} {config.label}
    </span>
  );
}

function ClaimRow({ label, raw, date, badge }: {
  label: string; raw: number; date: string;
  badge?: { text: string; green?: boolean; red?: boolean; amber?: boolean };
}) {
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <code className="text-sky-400 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">{label}</code>
        <span className="text-slate-400 font-mono">{raw}</span>
        <span className="text-slate-500">→ {date}</span>
      </div>
      {badge && (
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          badge.red    ? 'bg-red-100 text-red-600'    :
          badge.green  ? 'bg-green-100 text-green-700' :
          badge.amber  ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {badge.text}
        </span>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────

const JwtDecoder: React.FC = () => {
  const [token, setToken]         = useState('');
  const [secretOrKey, setSecretOrKey] = useState('');
  const [sigStatus, setSigStatus] = useState<SigStatus>('idle');
  const [sigError, setSigError]   = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  // ── parse ──
  const parsed = useMemo(() => {
    const raw = token.trim().replace(/\s+/g, '');
    if (!raw) return null;
    const parts = raw.split('.');
    if (parts.length !== 3)
      return { error: 'Invalid JWT — expected exactly 3 dot-separated parts.' };
    try {
      const header  = b64urlDecodeJson(parts[0]);
      const payload = b64urlDecodeJson(parts[1]);
      return { parts, header, payload, alg: header.alg as string | undefined };
    } catch {
      return { error: 'Could not decode JWT — check that it is valid base64url JSON.' };
    }
  }, [token]);

  const claims = useMemo(() => {
    if (!parsed || 'error' in parsed) return null;
    const now = Math.floor(Date.now() / 1000);
    const get = (k: string) => typeof parsed.payload[k] === 'number' ? parsed.payload[k] as number : null;
    const exp = get('exp'), iat = get('iat'), nbf = get('nbf');
    return {
      exp, iat, nbf,
      expExpired:  exp !== null && exp < now,
      nbfNotYet:   nbf !== null && nbf > now,
    };
  }, [parsed]);

  const isHmac = parsed && !('error' in parsed) && typeof parsed.alg === 'string' && parsed.alg.startsWith('HS');

  // ── verify ──
  const handleVerify = useCallback(async () => {
    if (!parsed || 'error' in parsed || !parsed.alg || !secretOrKey.trim()) return;
    setSigStatus('checking');
    setSigError(null);
    try {
      const result = await verifySignature(
        parsed.alg, parsed.parts[0], parsed.parts[1], parsed.parts[2], secretOrKey.trim(),
      );
      setSigStatus(result === 'unsupported' ? 'unsupported' : result ? 'valid' : 'invalid');
    } catch (e) {
      setSigStatus('error');
      setSigError(e instanceof Error ? e.message : 'Verification failed — check your key format.');
    }
  }, [parsed, secretOrKey]);

  const resetSig = () => { setSigStatus('idle'); setSigError(null); };

  const parts  = parsed && !('error' in parsed) ? parsed.parts  : null;
  const header  = parsed && !('error' in parsed) ? parsed.header  : null;
  const payload = parsed && !('error' in parsed) ? parsed.payload : null;

  const headerJson  = header  ? JSON.stringify(header,  null, 2) : '';
  const payloadJson = payload ? JSON.stringify(payload, null, 2) : '';

  // Overall token validity banner
  const tokenValid = !!parsed && !('error' in parsed);
  const expired    = claims?.expExpired;
  const nbfNotYet  = claims?.nbfNotYet;

  return (
    <div className="space-y-5 animate-in fade-in">

      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">JWT Decoder</h2>
        <Shield className="text-indigo-500" size={30} />
      </div>

      {/* Validity banner */}
      {tokenValid && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
          expired
            ? 'bg-red-50 border-red-200 text-red-700'
            : nbfNotYet
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {expired
            ? <ShieldX size={16} />
            : nbfNotYet
            ? <Shield size={16} />
            : <ShieldCheck size={16} />}
          {expired
            ? `Token expired — ${new Date(claims!.exp! * 1000).toLocaleString()}`
            : nbfNotYet
            ? `Token not yet valid — active from ${new Date(claims!.nbf! * 1000).toLocaleString()}`
            : 'Token structure is valid'}
          {claims?.iat !== null && claims?.iat !== undefined && (
            <span className="ml-auto text-xs opacity-70 font-normal">
              Issued {new Date(claims.iat * 1000).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── LEFT: Encoded ───────────────────────────────────────────── */}
        <div className="space-y-3">
          <SectionLabel>Encoded</SectionLabel>

          <textarea
            className="w-full h-36 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono text-xs resize-none bg-white leading-relaxed"
            placeholder="Paste your JWT here…"
            value={token}
            onChange={e => { setToken(e.target.value); resetSig(); }}
            spellCheck={false}
          />

          {/* Color-coded token */}
          {parts && (
            <div className="p-4 bg-slate-900 rounded-xl font-mono text-xs break-all leading-relaxed select-all cursor-text">
              <span className="text-rose-400">{parts[0]}</span>
              <span className="text-slate-600">.</span>
              <span className="text-violet-400">{parts[1]}</span>
              <span className="text-slate-600">.</span>
              <span className="text-cyan-400">{parts[2]}</span>
            </div>
          )}

          {/* Legend */}
          {parts && (
            <div className="flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" /> Header
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shrink-0" /> Payload
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" /> Signature
=======
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
>>>>>>> f761e3c864e051762717208d45b8da34b4be24fb
              </span>
            </div>
          )}

<<<<<<< HEAD
          {parsed?.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              <AlertCircle size={15} className="shrink-0" />
              {parsed.error}
            </div>
          )}
        </div>

        {/* ── RIGHT: Decoded ──────────────────────────────────────────── */}
        {header && payload && (
          <div className="space-y-5">

            {/* HEADER */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SectionLabel>Header</SectionLabel>
                  {parsed?.alg && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 border border-rose-200 uppercase tracking-wide">
                      {ALG_LABELS[parsed.alg] ?? parsed.alg}
                    </span>
                  )}
                </div>
                <CopyButton text={headerJson} id="jwt-header" copyStatus={copyStatus} onCopy={handleCopy} />
              </div>
              <div
                className="p-4 bg-slate-900 rounded-xl overflow-x-auto text-xs leading-relaxed"
                dangerouslySetInnerHTML={{ __html: `<pre style="margin:0">${highlight(headerJson)}</pre>` }}
              />
            </div>

            {/* PAYLOAD */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <SectionLabel>Payload</SectionLabel>
                <CopyButton text={payloadJson} id="jwt-payload" copyStatus={copyStatus} onCopy={handleCopy} />
              </div>
              <div
                className="p-4 bg-slate-900 rounded-xl overflow-x-auto text-xs leading-relaxed"
                dangerouslySetInnerHTML={{ __html: `<pre style="margin:0">${highlight(payloadJson)}</pre>` }}
              />

              {/* Standard claims breakdown */}
              {claims && (claims.exp !== null || claims.iat !== null || claims.nbf !== null) && (
                <div className="bg-slate-900 rounded-xl px-4 py-3 space-y-2.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Claims Breakdown</p>
                  {claims.exp !== null && (
                    <ClaimRow
                      label="exp" raw={claims.exp}
                      date={new Date(claims.exp * 1000).toLocaleString()}
                      badge={claims.expExpired
                        ? { text: 'Expired', red: true }
                        : { text: 'Valid',   green: true }}
                    />
                  )}
                  {claims.iat !== null && (
                    <ClaimRow label="iat" raw={claims.iat} date={new Date(claims.iat * 1000).toLocaleString()} />
                  )}
                  {claims.nbf !== null && (
                    <ClaimRow
                      label="nbf" raw={claims.nbf}
                      date={new Date(claims.nbf * 1000).toLocaleString()}
                      badge={claims.nbfNotYet ? { text: 'Not yet valid', amber: true } : undefined}
                    />
                  )}
                </div>
              )}
            </div>

            {/* VERIFY SIGNATURE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <SectionLabel>Verify Signature</SectionLabel>
                <SigStatusBadge status={sigStatus} />
              </div>

              {/* Pseudocode */}
              <div className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-slate-400 leading-relaxed">
                <span style={{ color: '#7dd3fc' }}>{parsed?.alg ?? 'ALGORITHM'}</span>
                {'(\n  base64UrlEncode(header) + "." +\n  base64UrlEncode(payload),\n  '}
                <span style={{ color: '#34d399' }}>
                  {isHmac ? 'your-256-bit-secret' : 'your-public-key'}
                </span>
                {'\n)'}
              </div>

              <textarea
                className="w-full h-20 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono text-xs resize-none bg-white leading-relaxed"
                placeholder={isHmac
                  ? 'Enter your HMAC secret…'
                  : 'Paste PEM public key (-----BEGIN PUBLIC KEY-----)'}
                value={secretOrKey}
                onChange={e => { setSecretOrKey(e.target.value); resetSig(); }}
                spellCheck={false}
              />

              {sigError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {sigError}
                </p>
              )}

              <button
                onClick={handleVerify}
                disabled={!secretOrKey.trim() || sigStatus === 'checking' || !parsed?.alg}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                {sigStatus === 'checking'
                  ? <><RefreshCw size={14} className="animate-spin" /> Verifying…</>
                  : 'Verify Signature'}
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="bg-slate-100 p-4 rounded-lg text-xs text-slate-500 leading-relaxed">
        <h4 className="font-bold text-slate-700 mb-2 uppercase tracking-wider">Supported algorithms</h4>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(ALG_LABELS).map(a => (
            <code key={a} className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">{a}</code>
          ))}
        </div>
        <p className="mt-2 text-slate-400">All decoding happens locally in your browser — no data is sent to any server.</p>
      </div>
=======
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
>>>>>>> f761e3c864e051762717208d45b8da34b4be24fb
    </div>
  );
};

export default JwtDecoder;
