import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, ImageUp } from 'lucide-react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

interface QrCodeToolProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

type Mode = 'generate' | 'decode';
type Level = 'L' | 'M' | 'Q' | 'H';

const QrCodeTool: React.FC<QrCodeToolProps> = ({ onCopy, copyStatus }) => {
  const [mode, setMode] = useState<Mode>('generate');

  // generate
  const [text, setText] = useState('https://example.com');
  const [size, setSize] = useState(256);
  const [level, setLevel] = useState<Level>('M');
  const [fg, setFg] = useState('#000000');
  const [bg, setBg] = useState('#ffffff');
  const [result, setResult] = useState<{ key: string; url: string; error: string }>({ key: '', url: '', error: '' });

  // decode
  const [decoded, setDecoded] = useState<{ text: string | null; preview: string } | null>(null);
  const [decodeError, setDecodeError] = useState('');

  const key = JSON.stringify([text, size, level, fg, bg]);

  useEffect(() => {
    if (!text) return;
    let cancelled = false;
    QRCode.toDataURL(text, { width: size, margin: 2, errorCorrectionLevel: level, color: { dark: fg, light: bg } })
      .then((url) => { if (!cancelled) setResult({ key, url, error: '' }); })
      .catch((e: Error) => { if (!cancelled) setResult({ key, url: '', error: e.message }); });
    return () => { cancelled = true; };
  }, [key, text, size, level, fg, bg]);

  const current = text && result.key === key ? result : null;

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setDecodeError('');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(data.data, data.width, data.height);
      setDecoded({ text: code ? code.data : null, preview: url });
    };
    img.onerror = () => { setDecodeError('Could not read this image.'); URL.revokeObjectURL(url); };
    img.src = url;
  };

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${active ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">QR Code</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['generate', 'decode'] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${mode === m ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>{m}</button>
          ))}
        </div>
      </div>

      {mode === 'generate' ? (
        <>
          <textarea
            className="w-full h-28 p-4 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
            placeholder="Text or URL to encode..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Error correction</span>
              {(['L', 'M', 'Q', 'H'] as Level[]).map((l) => <button key={l} onClick={() => setLevel(l)} className={chip(level === l)}>{l}</button>)}
            </div>
            <label className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Size</span>
              <input type="range" min={128} max={512} step={32} value={size} onChange={(e) => setSize(Number(e.target.value))} />
              <span className="font-mono text-xs w-14">{size}px</span>
            </label>
            <label className="flex items-center gap-2"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Color</span><input type="color" value={fg} onChange={(e) => setFg(e.target.value)} /></label>
            <label className="flex items-center gap-2"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Background</span><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} /></label>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center gap-4 min-h-[200px] justify-center">
            {current?.error && <div className="text-sm text-red-500">{current.error}</div>}
            {current?.url && (
              <>
                <img src={current.url} alt="QR code" width={size} height={size} className="max-w-full" style={{ imageRendering: 'pixelated' }} />
                <a href={current.url} download="qrcode.png" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-300 transition-all">
                  <Download size={15} /> Download PNG
                </a>
              </>
            )}
            {!text && <div className="text-sm text-slate-300 italic">Enter some text to generate a QR code</div>}
          </div>
        </>
      ) : (
        <>
          <label className="flex flex-col items-center justify-center gap-2 h-40 border-2 border-dashed border-slate-200 rounded-xl bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <ImageUp size={24} />
            <span className="text-sm">Click to choose an image containing a QR code</span>
          </label>

          {decodeError && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{decodeError}</div>}

          {decoded && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex gap-5 items-start">
              <img src={decoded.preview} alt="Uploaded" className="w-32 h-32 object-contain border border-slate-100 rounded-lg" />
              <div className="flex-1 min-w-0 space-y-3">
                {decoded.text === null ? (
                  <div className="text-sm text-amber-600">No QR code found in this image.</div>
                ) : (
                  <>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Decoded content</div>
                    <pre className="font-mono text-sm text-slate-800 whitespace-pre-wrap break-all">{decoded.text}</pre>
                    <button
                      onClick={() => onCopy(decoded.text!, 'qr-decode')}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-300 transition-all"
                    >
                      {copyStatus === 'qr-decode' ? <><Check size={14} className="text-green-500" /> Copied</> : <><Copy size={14} /> Copy</>}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QrCodeTool;
