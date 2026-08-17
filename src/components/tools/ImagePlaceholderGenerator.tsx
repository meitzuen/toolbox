import React, { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  Archive,
  Check,
  Download,
  Eye,
  ImagePlus,
  Plus,
  X,
} from 'lucide-react';

type FillMode = 'auto' | 'grid' | 'solid' | 'gradient' | 'transparent';
type ImgFormat = 'png' | 'jpeg';

interface Preset {
  group: string;
  name: string;
  w: number;
  h: number;
}

interface TrayItem {
  id: string;
  name: string;
  w: number;
  h: number;
}

const PRESETS: Preset[] = [
  { group: 'Mobile', name: 'iPhone SE', w: 375, h: 667 },
  { group: 'Mobile', name: 'iPhone 12/13/14', w: 390, h: 844 },
  { group: 'Mobile', name: 'iPhone Pro Max', w: 428, h: 926 },
  { group: 'Mobile', name: 'Android common', w: 360, h: 800 },
  { group: 'Tablet', name: 'iPad portrait', w: 768, h: 1024 },
  { group: 'Tablet', name: 'iPad landscape', w: 1024, h: 768 },
  { group: 'Tablet', name: 'iPad Air', w: 820, h: 1180 },
  { group: 'Desktop', name: 'Laptop', w: 1280, h: 800 },
  { group: 'Desktop', name: 'HD', w: 1366, h: 768 },
  { group: 'Desktop', name: 'Standard', w: 1440, h: 900 },
  { group: 'Desktop', name: 'Full HD', w: 1920, h: 1080 },
  { group: 'Desktop', name: '2K', w: 2560, h: 1440 },
  { group: 'Social', name: 'OG image', w: 1200, h: 630 },
  { group: 'Social', name: 'Square post', w: 1080, h: 1080 },
  { group: 'Social', name: 'Story', w: 1080, h: 1920 },
  { group: 'Social', name: 'Header banner', w: 1500, h: 500 },
  { group: 'Ad units', name: 'Mobile banner', w: 320, h: 50 },
  { group: 'Ad units', name: 'Medium rectangle', w: 300, h: 250 },
  { group: 'Ad units', name: 'Leaderboard', w: 728, h: 90 },
  { group: 'Edge cases', name: 'Tiny', w: 1, h: 1 },
  { group: 'Edge cases', name: 'Icon', w: 64, h: 64 },
  { group: 'Edge cases', name: 'Ultra-wide', w: 2400, h: 300 },
];

const FILL_MODES: { id: FillMode; label: string }[] = [
  { id: 'auto', label: 'Auto colors' },
  { id: 'grid', label: 'Grid (crop test)' },
  { id: 'solid', label: 'Solid' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'transparent', label: 'Transparent' },
];

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'image';
}

function hashHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

function clampDim(n: number): number {
  return Math.max(1, Math.min(6000, Math.round(n) || 1));
}

let idCounter = 0;
function makeItem(name: string, w: number, h: number): TrayItem {
  idCounter += 1;
  return { id: `img-${idCounter}`, name, w: clampDim(w), h: clampDim(h) };
}

function drawCenterText(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return;

  const maxWidth = w * 0.82;
  const maxHeight = h * 0.7;
  const fontFamily = '"Segoe UI", ui-sans-serif, system-ui, sans-serif';
  let fontSize = Math.max(10, Math.min(160, Math.round(Math.min(w, h) * 0.16)));

  const measure = (size: number) => {
    ctx.font = `700 ${size}px ${fontFamily}`;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const lineHeight = size * 1.25;
    return { widest, lineHeight, totalHeight: lineHeight * lines.length };
  };

  let { widest, lineHeight, totalHeight } = measure(fontSize);
  while ((widest > maxWidth || totalHeight > maxHeight) && fontSize > 8) {
    fontSize -= 1;
    ({ widest, lineHeight, totalHeight } = measure(fontSize));
  }

  const padX = fontSize * 0.6;
  const padY = fontSize * 0.4;
  const plateW = Math.min(w, widest + padX * 2);
  const plateH = Math.min(h, totalHeight + padY * 2);
  const radius = Math.min(12, plateH / 4);

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.roundRect(w / 2 - plateW / 2, h / 2 - plateH / 2, plateW, plateH, radius);
  ctx.fill();
  ctx.restore();

  ctx.font = `700 ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = fontSize * 0.25;

  const startY = h / 2 - totalHeight / 2 + lineHeight / 2;
  lines.forEach((line, i) => ctx.fillText(line, w / 2, startY + i * lineHeight));

  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function paintCanvas(
  canvas: HTMLCanvasElement,
  item: TrayItem,
  fillMode: FillMode,
  solidColor: string,
  burnLabel: boolean,
  centerText: string,
) {
  canvas.width = item.w;
  canvas.height = item.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { w, h } = item;
  const key = `${item.name}|${w}x${h}`;
  const hue = hashHue(key);

  ctx.clearRect(0, 0, w, h);

  let textColor = '#ffffff';
  let textShadow = 'rgba(0,0,0,0.35)';

  if (fillMode === 'transparent') {
    textColor = `hsl(${hue}, 60%, 30%)`;
    textShadow = 'rgba(255,255,255,0.6)';
  } else if (fillMode === 'solid') {
    ctx.fillStyle = solidColor;
    ctx.fillRect(0, 0, w, h);
  } else if (fillMode === 'gradient') {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, `hsl(${hue}, 65%, 55%)`);
    g.addColorStop(1, `hsl(${(hue + 55) % 360}, 65%, 32%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (fillMode === 'grid') {
    ctx.fillStyle = '#eef1f4';
    ctx.fillRect(0, 0, w, h);
    const step = Math.max(8, Math.round(Math.min(w, h) / 12));
    ctx.strokeStyle = `hsl(${hue}, 55%, 60%)`;
    ctx.lineWidth = Math.max(1, step / 24);
    ctx.beginPath();
    for (let x = 0; x <= w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 0; y <= h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    ctx.strokeStyle = `hsl(${hue}, 70%, 40%)`;
    ctx.lineWidth = Math.max(2, step / 8);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(w, h);
    ctx.moveTo(w, 0); ctx.lineTo(0, h);
    ctx.strokeStyle = `hsla(${hue}, 70%, 40%, 0.5)`;
    ctx.lineWidth = Math.max(1, step / 16);
    ctx.stroke();
    textColor = `hsl(${hue}, 70%, 30%)`;
    textShadow = 'rgba(255,255,255,0.7)';
  } else {
    ctx.fillStyle = `hsl(${hue}, 58%, 46%)`;
    ctx.fillRect(0, 0, w, h);
  }

  if (burnLabel) {
    const label = `${item.name}  ${w}×${h}`;
    const fontSize = Math.max(11, Math.min(28, Math.round(Math.min(w, h) / 9)));
    ctx.font = `600 ${fontSize}px ui-monospace, Consolas, monospace`;
    ctx.textBaseline = 'bottom';
    const padX = Math.max(6, fontSize * 0.5);
    const padY = Math.max(6, fontSize * 0.6);
    ctx.shadowColor = textShadow;
    ctx.shadowBlur = fontSize * 0.4;
    ctx.fillStyle = textColor;
    const tw = ctx.measureText(label).width;
    if (tw + padX * 2 <= w * 1.4) ctx.fillText(label, padX, h - padY);
    ctx.shadowBlur = 0;
  }

  if (centerText.trim()) drawCenterText(ctx, w, h, centerText);
}

function itemToBlob(
  item: TrayItem,
  fillMode: FillMode,
  solidColor: string,
  burnLabel: boolean,
  centerText: string,
  format: ImgFormat,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    paintCanvas(canvas, item, fillMode, solidColor, burnLabel, centerText);
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas export failed'));
    }, mime, 0.92);
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const groupedPresets = PRESETS.reduce<Record<string, Preset[]>>((acc, p) => {
  (acc[p.group] ??= []).push(p);
  return acc;
}, {});

const ImagePlaceholderGenerator: React.FC = () => {
  const [tray, setTray] = useState<TrayItem[]>([]);
  const [activeItem, setActiveItem] = useState<TrayItem>(() => makeItem('Custom', 800, 600));
  const [fillMode, setFillMode] = useState<FillMode>('auto');
  const [solidColor, setSolidColor] = useState('#4f46e5');
  const [burnLabel, setBurnLabel] = useState(true);
  const [centerText, setCenterText] = useState('');
  const [format, setFormat] = useState<ImgFormat>('png');
  const [customName, setCustomName] = useState('');
  const [customW, setCustomW] = useState(800);
  const [customH, setCustomH] = useState(600);
  const [zipping, setZipping] = useState(false);

  const previewRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (previewRef.current) {
      paintCanvas(previewRef.current, activeItem, fillMode, solidColor, burnLabel, centerText);
    }
  }, [activeItem, fillMode, solidColor, burnLabel, centerText]);

  const changeFillMode = (mode: FillMode) => {
    setFillMode(mode);
    if (mode === 'transparent') setFormat('png');
  };

  const changeFormat = (fmt: ImgFormat) => {
    setFormat(fmt);
    if (fmt === 'jpeg' && fillMode === 'transparent') setFillMode('auto');
  };

  const isInTray = (p: Pick<Preset, 'name' | 'w' | 'h'>) =>
    tray.some((t) => t.name === p.name && t.w === p.w && t.h === p.h);

  const togglePreset = (p: Preset) => {
    const existing = tray.find((t) => t.name === p.name && t.w === p.w && t.h === p.h);
    if (existing) {
      setTray((prev) => prev.filter((t) => t.id !== existing.id));
    } else {
      const item = makeItem(p.name, p.w, p.h);
      setTray((prev) => [...prev, item]);
      setActiveItem(item);
    }
  };

  const removeFromTray = (id: string) => setTray((prev) => prev.filter((t) => t.id !== id));

  const addCustom = () => {
    const item = makeItem(customName.trim() || 'Custom', customW, customH);
    setTray((prev) => [...prev, item]);
    setActiveItem(item);
    setCustomName('');
  };

  const ext = format === 'jpeg' ? 'jpg' : 'png';

  const downloadItem = async (item: TrayItem) => {
    const blob = await itemToBlob(item, fillMode, solidColor, burnLabel, centerText, format);
    downloadBlob(blob, `${slug(item.name)}-${item.w}x${item.h}.${ext}`);
  };

  const downloadAllAsZip = async () => {
    if (tray.length === 0) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const item of tray) {
        const blob = await itemToBlob(item, fillMode, solidColor, burnLabel, centerText, format);
        zip.file(`${slug(item.name)}-${item.w}x${item.h}.${ext}`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'test-images.zip');
    } finally {
      setZipping(false);
    }
  };

  const previewLabel = useMemo(
    () => `${activeItem.name} · ${activeItem.w}×${activeItem.h}px · ${format.toUpperCase()}`,
    [activeItem, format],
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Test Image Generator</h2>
        <ImagePlus className="text-indigo-500" size={32} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        {/* Presets */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">Sizes</label>
          {Object.entries(groupedPresets).map(([group, items]) => (
            <div key={group} className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map((p) => {
                  const active = isInTray(p);
                  return (
                    <button
                      key={`${p.name}-${p.w}-${p.h}`}
                      onClick={() => togglePreset(p)}
                      className={`relative group p-2.5 rounded-lg border text-left transition-all ${
                        active
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="font-semibold text-xs truncate pr-5">{p.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{p.w}&times;{p.h}</div>
                      <span
                        role="button"
                        aria-label={`Preview ${p.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveItem(makeItem(p.name, p.w, p.h));
                        }}
                        className="absolute top-1.5 right-1.5 p-1 rounded-md text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-indigo-100 hover:text-indigo-600 transition-all"
                      >
                        <Eye size={12} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Custom size */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-sm font-semibold text-slate-700">Custom size</label>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="label (optional)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1 min-w-[140px] px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="number"
              min={1}
              max={6000}
              value={customW}
              onChange={(e) => setCustomW(+e.target.value)}
              className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <span className="self-center text-slate-400">&times;</span>
            <input
              type="number"
              min={1}
              max={6000}
              value={customH}
              onChange={(e) => setCustomH(+e.target.value)}
              className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={addCustom}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
            >
              <Plus size={15} /> Add
            </button>
          </div>
        </div>

        {/* Fill mode */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-sm font-semibold text-slate-700">Fill</label>
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg gap-1">
            {FILL_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => changeFillMode(m.id)}
                className={`flex-1 min-w-[100px] py-1.5 text-xs font-medium rounded-md transition-all ${
                  fillMode === m.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {fillMode === 'solid' && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={solidColor}
                onChange={(e) => setSolidColor(e.target.value)}
                className="w-9 h-8 rounded-md border border-slate-200 cursor-pointer"
              />
              <span className="text-xs text-slate-400">fill color</span>
            </div>
          )}
        </div>

        {/* Center text */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-sm font-semibold text-slate-700">Center text</label>
          <textarea
            value={centerText}
            onChange={(e) => setCenterText(e.target.value)}
            placeholder="e.g. Hero banner draft"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <p className="text-xs text-slate-400">
            Rendered on a translucent plate in the middle of every image. Leave blank to hide it.
          </p>
        </div>

        {/* Label + format */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer select-none">
            <span
              onClick={() => setBurnLabel((v) => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${burnLabel ? 'bg-indigo-500' : 'bg-slate-300'}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  burnLabel ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </span>
            Burn in label
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            Format
            <select
              value={format}
              onChange={(e) => changeFormat(e.target.value as ImgFormat)}
              className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
            </select>
          </label>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-slate-900 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-800/50 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium font-mono">{previewLabel}</span>
          <button
            onClick={() => void downloadItem(activeItem)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <Download size={14} /> Download
          </button>
        </div>
        <div
          className="flex items-center justify-center p-6"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          }}
        >
          <canvas
            ref={previewRef}
            className="max-w-full shadow-lg rounded"
            style={{ maxHeight: 360 }}
          />
        </div>
      </div>

      {/* Tray */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            Tray &mdash; {tray.length} selected
          </h3>
          <button
            onClick={() => void downloadAllAsZip()}
            disabled={tray.length === 0 || zipping}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Archive size={14} /> {zipping ? 'Zipping…' : 'Download all (.zip)'}
          </button>
        </div>

        {tray.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-2">
            Click any size above to add it here, then download everything as one zip.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tray.map((item) => (
              <div
                key={item.id}
                className="border border-slate-200 rounded-lg overflow-hidden hover:border-indigo-300 transition-colors group"
              >
                <button
                  onClick={() => setActiveItem(item)}
                  className="w-full aspect-video flex items-center justify-center bg-slate-50 relative"
                >
                  {activeItem.id === item.id && (
                    <span className="absolute top-1 left-1 text-indigo-500">
                      <Check size={14} />
                    </span>
                  )}
                  <ThumbCanvas
                    item={item}
                    fillMode={fillMode}
                    solidColor={solidColor}
                    burnLabel={burnLabel}
                    centerText={centerText}
                  />
                </button>
                <div className="flex items-center justify-between px-2 py-1.5 bg-white">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{item.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{item.w}&times;{item.h}</div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => void downloadItem(item)}
                      title="Download"
                      className="p-1 text-slate-400 hover:text-indigo-600"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      onClick={() => removeFromTray(item.id)}
                      title="Remove"
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Generated locally with &lt;canvas&gt; &mdash; nothing is ever uploaded.
      </p>
    </div>
  );
};

const ThumbCanvas: React.FC<{
  item: TrayItem;
  fillMode: FillMode;
  solidColor: string;
  burnLabel: boolean;
  centerText: string;
}> = ({ item, fillMode, solidColor, burnLabel, centerText }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) paintCanvas(ref.current, item, fillMode, solidColor, burnLabel, centerText);
  }, [item, fillMode, solidColor, burnLabel, centerText]);
  return <canvas ref={ref} className="max-w-full max-h-full" />;
};

export default ImagePlaceholderGenerator;
