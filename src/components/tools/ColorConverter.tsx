import React, { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface ColorConverterProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

type RGB = { r: number; g: number; b: number; a: number };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, '0');

function parseColor(raw: string): RGB | null {
  const s = raw.trim().toLowerCase();
  let m = s.match(/^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = h.split('').map((c) => c + c).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/);
  if (m) {
    const a = m[4] === undefined ? 1 : m[5] ? Number(m[4]) / 100 : Number(m[4]);
    return { r: clamp(+m[1], 0, 255), g: clamp(+m[2], 0, 255), b: clamp(+m[3], 0, 255), a: clamp(a, 0, 1) };
  }
  m = s.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/);
  if (m) {
    const a = m[4] === undefined ? 1 : m[5] ? Number(m[4]) / 100 : Number(m[4]);
    return { ...hslToRgb(+m[1], clamp(+m[2], 0, 100), clamp(+m[3], 0, 100)), a: clamp(a, 0, 1) };
  }
  return null;
}

function hslToRgb(h: number, s: number, l: number): Omit<RGB, 'a'> {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 };
}

function rgbToHsl({ r, g, b }: RGB) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function luminance({ r, g, b }: RGB) {
  const [R, G, B] = [r, g, b].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrast(a: RGB, b: RGB) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE: RGB = { r: 255, g: 255, b: 255, a: 1 };

const Badge: React.FC<{ pass: boolean; label: string }> = ({ pass, label }) => (
  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${pass ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
    {label} {pass ? 'Pass' : 'Fail'}
  </span>
);

const ColorConverter: React.FC<ColorConverterProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState('#6366f1');
  const [bgInput, setBgInput] = useState('#ffffff');

  const color = useMemo(() => parseColor(input), [input]);
  const bg = useMemo(() => parseColor(bgInput) ?? WHITE, [bgInput]);

  const formats = useMemo(() => {
    if (!color) return [];
    const hsl = rgbToHsl(color);
    const hasAlpha = color.a < 1;
    const alpha = +color.a.toFixed(3);
    return [
      { id: 'hex', label: 'HEX', value: `#${hex2(color.r)}${hex2(color.g)}${hex2(color.b)}${hasAlpha ? hex2(color.a * 255) : ''}` },
      { id: 'rgb', label: 'RGB', value: hasAlpha ? `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha})` : `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})` },
      { id: 'hsl', label: 'HSL', value: hasAlpha ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})` : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    ];
  }, [color]);

  const ratio = color ? contrast(color, bg) : 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">Color Converter</h2>

      <div className="flex gap-3 items-center">
        <input
          type="color"
          value={color ? `#${hex2(color.r)}${hex2(color.g)}${hex2(color.b)}` : '#000000'}
          onChange={(e) => setInput(e.target.value)}
          className="w-14 h-14 rounded-xl border border-slate-200 bg-white p-1 cursor-pointer"
        />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-3 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
          placeholder="#6366f1 · rgb(99, 102, 241) · hsl(239, 84%, 67%)"
          spellCheck={false}
        />
      </div>

      {!color && input.trim() && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">Unrecognized color. Use HEX, rgb()/rgba() or hsl()/hsla().</div>
      )}

      {color && (
        <>
          <div className="space-y-3">
            {formats.map((f) => (
              <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-center">
                <span className="w-12 shrink-0 text-xs font-bold text-slate-500 uppercase tracking-wide">{f.label}</span>
                <code className="flex-1 text-sm text-slate-700 font-mono">{f.value}</code>
                <button
                  onClick={() => onCopy(f.value, `color-${f.id}`)}
                  className={`shrink-0 p-1.5 rounded-lg transition-all ${copyStatus === `color-${f.id}` ? 'text-green-500' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                >
                  {copyStatus === `color-${f.id}` ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contrast (WCAG)</span>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                Background
                <input value={bgInput} onChange={(e) => setBgInput(e.target.value)} className="w-28 px-2 py-1 border border-slate-200 rounded-md font-mono text-xs outline-none focus:border-indigo-500" spellCheck={false} />
              </div>
            </div>
            <div className="rounded-lg p-6 border border-slate-100" style={{ backgroundColor: `rgb(${bg.r}, ${bg.g}, ${bg.b})`, color: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})` }}>
              <div className="text-2xl font-bold">Large text sample</div>
              <div className="text-sm">The quick brown fox jumps over the lazy dog.</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-lg font-semibold text-slate-800 mr-2">{ratio.toFixed(2)} : 1</span>
              <Badge pass={ratio >= 4.5} label="AA" />
              <Badge pass={ratio >= 3} label="AA Large" />
              <Badge pass={ratio >= 7} label="AAA" />
              <Badge pass={ratio >= 4.5} label="AAA Large" />
            </div>
            {color.a < 1 && <p className="text-xs text-slate-400">Contrast is computed on the opaque color; alpha is ignored.</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default ColorConverter;
