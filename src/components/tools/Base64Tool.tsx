import React, { useState, useMemo } from 'react';
import { ArrowLeftRight, Copy, Check } from 'lucide-react';

interface Base64ToolProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const encodeBase64 = (str: string): string => {
  try {
    return btoa(
      new TextEncoder().encode(str).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
  } catch {
    return 'Encoding error';
  }
};

const decodeBase64 = (str: string): string => {
  try {
    return new TextDecoder().decode(
      Uint8Array.from(atob(str.trim()), c => c.charCodeAt(0))
    );
  } catch {
    return 'Invalid Base64 input';
  }
};

const Base64Tool: React.FC<Base64ToolProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  const output = useMemo(() => {
    if (!input.trim()) return '';
    return mode === 'encode' ? encodeBase64(input) : decodeBase64(input);
  }, [input, mode]);

  const swapValues = () => {
    setInput(output);
    setMode(m => (m === 'encode' ? 'decode' : 'encode'));
  };

  const isError = output === 'Invalid Base64 input' || output === 'Encoding error';

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Base64 Encoder / Decoder</h2>
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

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {mode === 'encode' ? 'Plain Text Input' : 'Base64 Input'}
        </label>
        <textarea
          className="w-full h-40 p-4 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
          placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 string to decode...'}
          value={input}
          onChange={e => setInput(e.target.value)}
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
            {mode === 'encode' ? 'Base64 Output' : 'Decoded Text'}
          </span>
          <button
            onClick={() => output && !isError && onCopy(output, 'base64')}
            disabled={!output || isError}
            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${
              copyStatus === 'base64'
                ? 'bg-green-500/10 text-green-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30'
            }`}
          >
            {copyStatus === 'base64' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
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

export default Base64Tool;
