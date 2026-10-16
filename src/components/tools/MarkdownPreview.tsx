import React, { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownPreviewProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const SAMPLE = `# Hello Markdown

Write **bold**, *italic*, \`inline code\` and [links](https://example.com).

- A list item
- Another one
  - Nested

1. First
2. Second

> A blockquote

\`\`\`js
console.log('code block');
\`\`\`

| Name | Role |
| ---- | ---- |
| Ann  | Dev  |
| Ben  | QA   |

- [x] Task lists
- [ ] work too
`;

// Tailwind has no typography plugin here, so style rendered elements via descendant selectors.
const PROSE = [
  'text-slate-700 leading-relaxed break-words',
  '[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-slate-200',
  '[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:pb-1 [&_h2]:border-b [&_h2]:border-slate-100',
  '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:font-semibold [&_h4]:mt-3',
  '[&_p]:my-3 [&_a]:text-indigo-600 [&_a]:underline',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_li]:my-1',
  '[&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:text-slate-500 [&_blockquote]:my-3',
  '[&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.9em] [&_code]:font-mono',
  '[&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-auto [&_pre]:my-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_table]:border-collapse [&_table]:my-3 [&_th]:border [&_th]:border-slate-300 [&_th]:px-3 [&_th]:py-1.5 [&_th]:bg-slate-50 [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-1.5',
  '[&_hr]:my-6 [&_hr]:border-slate-200 [&_img]:max-w-full',
].join(' ');

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ onCopy, copyStatus }) => {
  const [input, setInput] = useState(SAMPLE);
  const [view, setView] = useState<'preview' | 'html'>('preview');

  const html = useMemo(() => {
    const raw = marked.parse(input, { async: false, gfm: true, breaks: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [input]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Markdown Preview</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {([['preview', 'Preview'], ['html', 'HTML']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        <textarea
          className="w-full h-[560px] p-4 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none bg-white"
          placeholder="Write Markdown here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="relative h-[560px] bg-white border border-slate-200 rounded-xl overflow-auto">
          {view === 'preview' ? (
            <div className={`p-5 ${PROSE}`} dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <>
              <button
                onClick={() => onCopy(html, 'markdown-html')}
                className="sticky top-3 float-right mr-3 mt-3 p-2 rounded-lg flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-indigo-600 bg-white border border-slate-200"
              >
                {copyStatus === 'markdown-html' ? <><Check size={14} className="text-green-500" /> Copied</> : <><Copy size={14} /> Copy HTML</>}
              </button>
              <pre className="p-5 font-mono text-xs text-slate-700 whitespace-pre-wrap break-all">{html}</pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkdownPreview;
