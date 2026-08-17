import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, Check, Copy } from 'lucide-react';

interface UrlEncoderDecoderProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

type Mode = 'encode' | 'decode';
type EncodeScope = 'component' | 'full';

const ENCODING_ERROR = 'Encoding error';
const DECODING_ERROR = 'Invalid encoded input — check for a stray % or malformed escape sequence';

function urlEncode(str: string, scope: EncodeScope, plusForSpace: boolean): string {
  try {
    let out = scope === 'full' ? encodeURI(str) : encodeURIComponent(str);
    if (plusForSpace) out = out.replace(/%20/g, '+');
    return out;
  } catch {
    return ENCODING_ERROR;
  }
}

function urlDecode(str: string, plusForSpace: boolean): string {
  try {
    const prepped = plusForSpace ? str.replace(/\+/g, '%20') : str;
    return decodeURIComponent(prepped);
  } catch {
    return DECODING_ERROR;
  }
}

const UrlEncoderDecoder: React.FC<UrlEncoderDecoderProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [scope, setScope] = useState<EncodeScope>('component');
  const [plusForSpace, setPlusForSpace] = useState(false);

  const output = useMemo(() => {
    if (!input) return '';
    return mode === 'encode' ? urlEncode(input, scope, plusForSpace) : urlDecode(input, plusForSpace);
  }, [input, mode, scope, plusForSpace]);

  const isError = output === ENCODING_ERROR || output === DECODING_ERROR;

  const swapValues = () => {
    setInput(isError ? '' : output);
    setMode((m) => (m === 'encode' ? 'decode' : 'encode'));
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">URL Encoder / Decoder</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('encode')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'encode' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Encode
          </button>
          <button
            onClick={() => setMode('decode')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'decode' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Decode
          </button>
        </div>
      </div>

      {mode === 'encode' && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setScope('component')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              scope === 'component'
                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
            title="encodeURIComponent — escapes every reserved character. Use for query params and form values."
          >
            Component
          </button>
          <button
            onClick={() => setScope('full')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              scope === 'full'
                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
            title="encodeURI — keeps URL structure characters like : / ? & = intact. Use for whole URLs."
          >
            Full URI
          </button>
          <span className="text-xs text-slate-400">
            {scope === 'component'
              ? 'Escapes reserved characters — use for a single query value.'
              : 'Preserves : / ? # & = etc. — use for a whole URL.'}
          </span>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={plusForSpace}
          onChange={(e) => setPlusForSpace(e.target.checked)}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
        />
        Use <code className="px-1 py-0.5 bg-slate-100 rounded font-mono text-xs">+</code> for spaces (form encoding)
      </label>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {mode === 'encode' ? 'Plain Text / URL Input' : 'URL-Encoded Input'}
        </label>
        <textarea
          className="w-full h-40 p-4 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
          placeholder={
            mode === 'encode'
              ? 'https://example.com/search?q=hello world&lang=en'
              : 'https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world'
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <div className="flex justify-center">
        <button
          onClick={swapValues}
          disabled={!output || isError}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeftRight size={16} /> Swap &amp; Flip Mode
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            {mode === 'encode' ? 'URL-Encoded Output' : 'Decoded Text'}
          </span>
          <button
            onClick={() => output && !isError && onCopy(output, 'url-encode')}
            disabled={!output || isError}
            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${
              copyStatus === 'url-encode'
                ? 'bg-green-500/10 text-green-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30'
            }`}
          >
            {copyStatus === 'url-encode' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
        <div className={`min-h-[100px] p-4 font-mono text-sm overflow-auto break-all leading-relaxed ${
          isError ? 'text-red-400' : 'text-blue-300/90'
        }`}>
          {output || <span className="text-slate-500 italic">Output will appear here...</span>}
        </div>
      </div>
    </div>
  );
};

export default UrlEncoderDecoder;
