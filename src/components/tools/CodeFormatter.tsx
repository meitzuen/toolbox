import React, { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import beautify from 'js-beautify';
import { format as formatSql } from 'sql-formatter';

interface CodeFormatterProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

type Lang = 'html' | 'xml' | 'css' | 'sql';

const LANGS: { id: Lang; label: string; placeholder: string }[] = [
  { id: 'html', label: 'HTML', placeholder: '<div><p>Hello <b>world</b></p><ul><li>a</li><li>b</li></ul></div>' },
  { id: 'xml', label: 'XML', placeholder: '<root><item id="1"><name>Ann</name></item><item id="2"/></root>' },
  { id: 'css', label: 'CSS', placeholder: 'body{margin:0;padding:0}.a,.b{color:red}' },
  { id: 'sql', label: 'SQL', placeholder: 'select u.id, u.name from users u join orders o on o.user_id = u.id where o.total > 100 order by u.name' },
];

function run(lang: Lang, src: string, indent: number, minify: boolean): string {
  if (minify) {
    switch (lang) {
      case 'html':
      case 'xml': return src.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
      case 'css': return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim();
      case 'sql': return src.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
    }
  }
  switch (lang) {
    case 'html': return beautify.html(src, { indent_size: indent, wrap_line_length: 0 });
    case 'xml': return beautify.html(src, { indent_size: indent, wrap_line_length: 0, indent_inner_html: true, unformatted: [], content_unformatted: [], inline: [] });
    case 'css': return beautify.css(src, { indent_size: indent });
    case 'sql': return formatSql(src, { tabWidth: indent, keywordCase: 'upper' });
  }
}

const CodeFormatter: React.FC<CodeFormatterProps> = ({ onCopy, copyStatus }) => {
  const [lang, setLang] = useState<Lang>('html');
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState(2);
  const [minify, setMinify] = useState(false);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' };
    try {
      return { output: run(lang, input, indent, minify), error: '' };
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : 'Formatting failed' };
    }
  }, [lang, input, indent, minify]);

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${active ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`;

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">HTML / XML / CSS / SQL Formatter</h2>

      <div className="flex flex-wrap items-center gap-2">
        {LANGS.map((l) => (
          <button key={l.id} onClick={() => setLang(l.id)} className={chip(lang === l.id)}>{l.label}</button>
        ))}
        <div className="ml-auto flex items-center gap-4 text-sm text-slate-600">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={minify} onChange={(e) => setMinify(e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
            Minify
          </label>
          <select value={indent} disabled={minify} onChange={(e) => setIndent(Number(e.target.value))} className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white disabled:opacity-40">
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </div>
      </div>

      <textarea
        className="w-full h-56 p-4 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
        placeholder={LANGS.find((l) => l.id === lang)!.placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{minify ? 'Minified' : 'Formatted'}</span>
          <button
            onClick={() => output && onCopy(output, 'code-format')}
            disabled={!output}
            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${
              copyStatus === 'code-format' ? 'bg-green-500/10 text-green-400' : 'text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30'
            }`}
          >
            {copyStatus === 'code-format' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
        <pre className={`min-h-[100px] max-h-[420px] p-4 font-mono text-sm overflow-auto leading-relaxed ${error ? 'text-red-400' : 'text-blue-300/90'}`}>
          {error || output || <span className="text-slate-500 italic">Output will appear here...</span>}
        </pre>
      </div>
    </div>
  );
};

export default CodeFormatter;
