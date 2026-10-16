import React, { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CurlConverterProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

interface ParsedCurl {
  method: string;
  url: string;
  headers: [string, string][];
  body: string | null;
  form: [string, string][];
}

function tokenize(input: string): string[] {
  const src = input.replace(/\\\r?\n/g, ' ').trim();
  const tokens: string[] = [];
  let cur = '';
  let started = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "'") {
      started = true;
      const end = src.indexOf("'", i + 1);
      if (end < 0) throw new Error('Unterminated single quote');
      cur += src.slice(i + 1, end);
      i = end;
    } else if (c === '"') {
      started = true;
      i++;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\' && /["\\$`]/.test(src[i + 1] ?? '')) i++;
        cur += src[i++];
      }
      if (i >= src.length) throw new Error('Unterminated double quote');
    } else if (c === '\\' && i + 1 < src.length) {
      started = true;
      cur += src[++i];
    } else if (/\s/.test(c)) {
      if (started) { tokens.push(cur); cur = ''; started = false; }
    } else {
      started = true;
      cur += c;
    }
  }
  if (started) tokens.push(cur);
  return tokens;
}

function parseCurl(input: string): ParsedCurl {
  const tokens = tokenize(input);
  if (tokens[0] !== 'curl') throw new Error('Command must start with "curl"');
  const out: ParsedCurl = { method: '', url: '', headers: [], body: null, form: [] };
  const bodies: string[] = [];
  let getMode = false;

  for (let i = 1; i < tokens.length; i++) {
    let t = tokens[i];
    let inline: string | undefined;
    if (t.startsWith('--') && t.includes('=')) {
      inline = t.slice(t.indexOf('=') + 1);
      t = t.slice(0, t.indexOf('='));
    }
    const next = () => inline ?? tokens[++i] ?? '';
    switch (t) {
      case '-X': case '--request': out.method = next().toUpperCase(); break;
      case '-H': case '--header': {
        const h = next();
        const idx = h.indexOf(':');
        if (idx > 0) out.headers.push([h.slice(0, idx).trim(), h.slice(idx + 1).trim()]);
        break;
      }
      case '-d': case '--data': case '--data-raw': case '--data-binary': case '--data-ascii': bodies.push(next()); break;
      case '--data-urlencode': {
        const v = next();
        const eq = v.indexOf('=');
        bodies.push(eq < 0 ? encodeURIComponent(v) : `${v.slice(0, eq)}=${encodeURIComponent(v.slice(eq + 1))}`);
        break;
      }
      case '-F': case '--form': {
        const v = next();
        const eq = v.indexOf('=');
        if (eq > 0) out.form.push([v.slice(0, eq), v.slice(eq + 1)]);
        break;
      }
      case '-u': case '--user': out.headers.push(['Authorization', `Basic ${btoa(next())}`]); break;
      case '-A': case '--user-agent': out.headers.push(['User-Agent', next()]); break;
      case '-e': case '--referer': out.headers.push(['Referer', next()]); break;
      case '-b': case '--cookie': out.headers.push(['Cookie', next()]); break;
      case '--url': out.url = next(); break;
      case '-G': case '--get': getMode = true; break;
      case '-I': case '--head': out.method = 'HEAD'; break;
      default:
        if (!t.startsWith('-') && !out.url) out.url = t;
    }
  }

  if (!out.url) throw new Error('No URL found');
  if (bodies.length) out.body = bodies.join('&');
  if (getMode && out.body) {
    out.url += (out.url.includes('?') ? '&' : '?') + out.body;
    out.body = null;
  }
  if (!out.method) out.method = out.body !== null || out.form.length ? 'POST' : 'GET';
  if (out.body !== null && !out.headers.some(([k]) => k.toLowerCase() === 'content-type')) {
    out.headers.push(['Content-Type', 'application/x-www-form-urlencoded']);
  }
  return out;
}

const isJson = (s: string | null) => {
  if (s === null) return false;
  try { JSON.parse(s); return true; } catch { return false; }
};

function toPostman(p: ParsedCurl): string {
  let url: Record<string, unknown> = { raw: p.url };
  try {
    const u = new URL(p.url);
    url = {
      raw: p.url,
      protocol: u.protocol.replace(':', ''),
      host: u.hostname.split('.'),
      ...(u.port ? { port: u.port } : {}),
      path: u.pathname.split('/').filter(Boolean),
      ...(u.search ? { query: [...u.searchParams].map(([key, value]) => ({ key, value })) } : {}),
    };
  } catch { /* keep raw URL only */ }

  const request: Record<string, unknown> = {
    method: p.method,
    header: p.headers.map(([key, value]) => ({ key, value, type: 'text' })),
    url,
  };
  if (p.form.length) {
    request.body = {
      mode: 'formdata',
      formdata: p.form.map(([key, value]) =>
        value.startsWith('@') ? { key, type: 'file', src: value.slice(1) } : { key, value, type: 'text' }),
    };
  } else if (p.body !== null) {
    request.body = {
      mode: 'raw',
      raw: p.body,
      options: { raw: { language: isJson(p.body) ? 'json' : 'text' } },
    };
  }
  return JSON.stringify({
    info: {
      name: 'cURL import',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [{ name: `${p.method} ${p.url}`, request }],
  }, null, 2);
}

const q = (s: string) => JSON.stringify(s);

function bodyExpr(p: ParsedCurl): string | null {
  if (p.form.length) return 'formData';
  return p.body === null ? null : q(p.body);
}

function toFetch(p: ParsedCurl): string {
  const lines: string[] = [];
  if (p.form.length) {
    lines.push('const formData = new FormData();');
    p.form.forEach(([k, v]) => lines.push(`formData.append(${q(k)}, ${q(v)}); // ${v.startsWith('@') ? 'file upload: attach a File/Blob here' : 'text field'}`));
    lines.push('');
  }
  const headers = p.headers.map(([k, v]) => `    ${q(k)}: ${q(v)},`).join('\n');
  const body = bodyExpr(p);
  const opts = [`  method: ${q(p.method)},`, headers && `  headers: {\n${headers}\n  },`, body && `  body: ${body},`].filter(Boolean).join('\n');
  lines.push(`const response = await fetch(${q(p.url)}, {\n${opts}\n});`, 'const data = await response.text();');
  return lines.join('\n');
}

function toAxios(p: ParsedCurl): string {
  const lines: string[] = [];
  if (p.form.length) {
    lines.push('const formData = new FormData();');
    p.form.forEach(([k, v]) => lines.push(`formData.append(${q(k)}, ${q(v)});`));
    lines.push('');
  }
  const headers = p.headers.map(([k, v]) => `    ${q(k)}: ${q(v)},`).join('\n');
  const body = bodyExpr(p);
  const parts = [`  method: ${q(p.method.toLowerCase())},`, `  url: ${q(p.url)},`, headers && `  headers: {\n${headers}\n  },`, body && `  data: ${body},`].filter(Boolean);
  lines.push(`const response = await axios({\n${parts.join('\n')}\n});`);
  return lines.join('\n');
}

type Target = 'postman' | 'fetch' | 'axios';
const TARGETS: { id: Target; label: string; run: (p: ParsedCurl) => string }[] = [
  { id: 'postman', label: 'Postman Collection', run: toPostman },
  { id: 'fetch', label: 'fetch', run: toFetch },
  { id: 'axios', label: 'axios', run: toAxios },
];

const CurlConverter: React.FC<CurlConverterProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState('');
  const [target, setTarget] = useState<Target>('postman');

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' };
    try {
      return { output: TARGETS.find((t) => t.id === target)!.run(parseCurl(input)), error: '' };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : 'Failed to parse cURL command' };
    }
  }, [input, target]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">cURL Converter</h2>
      <p className="text-slate-500 text-sm">Paste a cURL command (e.g. “Copy as cURL” from browser DevTools) and convert it to a Postman collection, fetch or axios.</p>

      <div className="flex flex-wrap gap-2">
        {TARGETS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTarget(t.id)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              target === t.id ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        className="w-full h-48 p-4 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
        placeholder={`curl -X POST 'https://api.example.com/users?active=true' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"name":"Ann"}'`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Output</span>
          <button
            onClick={() => output && onCopy(output, 'curl')}
            disabled={!output}
            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${
              copyStatus === 'curl' ? 'bg-green-500/10 text-green-400' : 'text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30'
            }`}
          >
            {copyStatus === 'curl' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
        <pre className={`min-h-[100px] max-h-[420px] p-4 font-mono text-sm overflow-auto leading-relaxed ${error ? 'text-red-400' : 'text-blue-300/90'}`}>
          {error || output || <span className="text-slate-500 italic">Output will appear here...</span>}
        </pre>
      </div>
    </div>
  );
};

export default CurlConverter;
