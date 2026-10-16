import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, ImageUp } from 'lucide-react';

interface ImageBase64Props {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

type Mode = 'encode' | 'decode';

const MAX_BYTES = 10 * 1024 * 1024;

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

const MIME_BY_SIGNATURE: [string, string][] = [
  ['iVBORw0KGgo', 'image/png'], ['/9j/', 'image/jpeg'], ['R0lGOD', 'image/gif'], ['UklGR', 'image/webp'], ['PHN2Zy', 'image/svg+xml'], ['PD94bWwg', 'image/svg+xml'],
];

function normalizeDataUrl(raw: string): string | null {
  const s = raw.trim().replace(/^["']|["']$/g, '');
  if (!s) return null;
  if (/^data:image\/[\w.+-]+;base64,[A-Za-z0-9+/=\s]+$/.test(s)) return s.replace(/\s+/g, '');
  const compact = s.replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]+=*$/.test(compact)) return null;
  const mime = MIME_BY_SIGNATURE.find(([sig]) => compact.startsWith(sig))?.[1];
  return mime ? `data:${mime};base64,${compact}` : null;
}

const CopyRow: React.FC<{ label: string; value: string; id: string } & ImageBase64Props> = ({ label, value, id, onCopy, copyStatus }) => (
  <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
    <div className="px-4 py-2.5 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{label}</span>
      <button onClick={() => onCopy(value, id)} className={`p-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${copyStatus === id ? 'text-green-400' : 'text-slate-400 hover:text-white'}`}>
        {copyStatus === id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
      </button>
    </div>
    <pre className="p-4 font-mono text-xs text-blue-300/90 max-h-32 overflow-auto whitespace-pre-wrap break-all">{value.length > 4000 ? `${value.slice(0, 4000)}…  (${value.length.toLocaleString()} chars — copy for full value)` : value}</pre>
  </div>
);

const ImageBase64: React.FC<ImageBase64Props> = ({ onCopy, copyStatus }) => {
  const [mode, setMode] = useState<Mode>('encode');
  const [file, setFile] = useState<{ name: string; size: number; dataUrl: string } | null>(null);
  const [error, setError] = useState('');
  const [pasted, setPasted] = useState('');

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setError('');
    if (!f.type.startsWith('image/')) return setError('Please choose an image file.');
    if (f.size > MAX_BYTES) return setError('Image is larger than 10 MB.');
    try {
      setFile({ name: f.name, size: f.size, dataUrl: await readAsDataUrl(f) });
    } catch {
      setError('Could not read this file.');
    }
  };

  const decoded = useMemo(() => normalizeDataUrl(pasted), [pasted]);
  const ext = decoded ? (decoded.match(/^data:image\/([\w.+-]+)/)?.[1] ?? 'png').replace('svg+xml', 'svg').replace('jpeg', 'jpg') : 'png';

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Image ⇄ Base64</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {([['encode', 'Image → Base64'], ['decode', 'Base64 → Image']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setMode(id)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
          ))}
        </div>
      </div>

      {mode === 'encode' ? (
        <>
          <label className="flex flex-col items-center justify-center gap-2 h-36 border-2 border-dashed border-slate-200 rounded-xl bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <ImageUp size={24} />
            <span className="text-sm">Click to choose an image (max 10 MB)</span>
          </label>
          {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}
          {file && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-center">
                <img src={file.dataUrl} alt="Preview" className="w-24 h-24 object-contain border border-slate-100 rounded-lg bg-slate-50" />
                <div className="text-sm">
                  <div className="font-mono text-slate-800 break-all">{file.name}</div>
                  <div className="text-slate-400 text-xs mt-1">{file.size.toLocaleString()} bytes → {file.dataUrl.length.toLocaleString()} chars encoded (+{Math.round((file.dataUrl.length / file.size - 1) * 100)}%)</div>
                </div>
              </div>
              <CopyRow label="Data URI" value={file.dataUrl} id="img-datauri" onCopy={onCopy} copyStatus={copyStatus} />
              <CopyRow label="Raw Base64" value={file.dataUrl.slice(file.dataUrl.indexOf(',') + 1)} id="img-raw" onCopy={onCopy} copyStatus={copyStatus} />
              <CopyRow label="HTML <img>" value={`<img src="${file.dataUrl}" alt="" />`} id="img-html" onCopy={onCopy} copyStatus={copyStatus} />
              <CopyRow label="CSS background" value={`background-image: url("${file.dataUrl}");`} id="img-css" onCopy={onCopy} copyStatus={copyStatus} />
            </div>
          )}
        </>
      ) : (
        <>
          <textarea
            className="w-full h-40 p-4 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
            placeholder="Paste a data URI (data:image/png;base64,...) or raw Base64..."
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
          />
          {pasted.trim() && !decoded && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">Not a recognizable image. Use a data:image/...;base64 URI, or raw Base64 of a PNG / JPEG / GIF / WebP / SVG.</div>
          )}
          {decoded && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center gap-4">
              <img src={decoded} alt="Decoded" className="max-w-full max-h-96 object-contain border border-slate-100 bg-slate-50" />
              <a href={decoded} download={`image.${ext}`} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-300 transition-all">
                <Download size={15} /> Download image.{ext}
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageBase64;
