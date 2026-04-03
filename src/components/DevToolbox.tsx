// Filename: src/components/Devtoolbox.tsx
import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Columns, 
  SearchCode, 
  FileJson, 
  Fingerprint, 
  Clock, 
  Lock,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';

// --- Types ---
type ToolType = 'jwt' | 'list-comp' | 'regex' | 'json' | 'uuid' | 'timestamp' | 'password';

const DevToolbox: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('jwt');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const menuItems = [
    { id: 'jwt', label: 'JWT Decoder', icon: ShieldCheck },
    { id: 'list-comp', label: 'List Comparator', icon: Columns },
    { id: 'regex', label: 'Regex Validator', icon: SearchCode },
    { id: 'json', label: 'JSON Formatter', icon: FileJson },
    { id: 'uuid', label: 'UUID Gen', icon: Fingerprint },
    { id: 'timestamp', label: 'Timestamp', icon: Clock },
    { id: 'password', label: 'Password Gen', icon: Lock },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <SearchCode size={24} /> DevTools
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTool(item.id as ToolType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTool === item.id 
                ? 'bg-indigo-50 text-indigo-600 font-medium' 
                : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          {activeTool === 'jwt' && <JwtDecoder />}
          {activeTool === 'list-comp' && <ListComparator />}
          {activeTool === 'regex' && <RegexValidator />}
          {activeTool === 'json' && <JsonFormatter />}
          {activeTool === 'uuid' && <UuidGenerator onCopy={handleCopy} copyStatus={copyStatus} />}
          {activeTool === 'timestamp' && <TimestampTool />}
          {activeTool === 'password' && <PasswordGenerator onCopy={handleCopy} copyStatus={copyStatus} />}
        </div>
      </main>

      {/* Global Toast */}
      {copyStatus && (
        <div className="fixed bottom-8 right-8 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <Check size={16} className="text-green-400" /> Copied!
        </div>
      )}
    </div>
  );
};

// --- Sub-Components ---

const JwtDecoder = () => {
  const [input, setInput] = useState('');
  const decoded = useMemo(() => {
    try {
      const parts = input.split('.');
      if (parts.length < 2) return null;
      // Decode base64 handling padding
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.stringify(JSON.parse(window.atob(base64)), null, 2);
    } catch { return 'Invalid JWT Payload'; }
  }, [input]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold">JWT Decoder</h2>
      <textarea 
        className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
        placeholder="Paste your JWT here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto min-h-[200px] text-sm leading-relaxed">
        {input ? decoded : "// Decoded payload will appear here..."}
      </pre>
    </div>
  );
};

const ListComparator = () => {
  const [listA, setListA] = useState('');
  const [listB, setListB] = useState('');
  
  const diff = useMemo(() => {
    const a = listA.split('\n').map(i => i.trim()).filter(Boolean);
    const b = listB.split('\n').map(i => i.trim()).filter(Boolean);
    return {
      onlyA: a.filter(x => !b.includes(x)),
      onlyB: b.filter(x => !a.includes(x)),
      intersection: a.filter(x => b.includes(x))
    };
  }, [listA, listB]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold">List Comparator</h2>
      <div className="grid grid-cols-2 gap-4">
        <textarea placeholder="List A (one per line)" className="h-40 p-3 border rounded-lg font-mono text-sm" onChange={e => setListA(e.target.value)} />
        <textarea placeholder="List B (one per line)" className="h-40 p-3 border rounded-lg font-mono text-sm" onChange={e => setListB(e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <ResultBox title="Only in A" data={diff.onlyA} color="red" />
        <ResultBox title="Common" data={diff.intersection} color="blue" />
        <ResultBox title="Only in B" data={diff.onlyB} color="green" />
      </div>
    </div>
  );
};

const ResultBox = ({ title, data, color }: { title: string, data: string[], color: 'red' | 'blue' | 'green' }) => (
  <div className={`p-4 rounded-lg border ${color === 'red' ? 'bg-red-50 border-red-100' : color === 'blue' ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
    <h4 className={`font-bold mb-2 ${color === 'red' ? 'text-red-700' : color === 'blue' ? 'text-blue-700' : 'text-green-700'}`}>{title} ({data.length})</h4>
    <div className="text-xs font-mono max-h-40 overflow-y-auto break-all">
      {data.length > 0 ? data.join('\n') : <span className="opacity-50 italic">None</span>}
    </div>
  </div>
);

const RegexValidator = () => {
  const [regex, setRegex] = useState('');
  const [testString, setTestString] = useState('');
  const result = useMemo(() => {
    if (!regex) return null;
    try {
      const re = new RegExp(regex, 'g');
      return re.test(testString);
    } catch { return 'error'; }
  }, [regex, testString]);

  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-2xl font-bold">Regex Validator</h2>
      <input 
        className="w-full p-3 border rounded-lg font-mono" 
        placeholder="Enter Regex (e.g. ^[0-9]+$)" 
        onChange={e => setRegex(e.target.value)}
      />
      <textarea 
        className="w-full h-32 p-3 border rounded-lg" 
        placeholder="Test string..." 
        onChange={e => setTestString(e.target.value)}
      />
      <div className={`p-4 rounded-lg font-bold text-center transition-colors ${
        result === true ? 'bg-green-100 text-green-700' : 
        result === false ? 'bg-red-100 text-red-700' : 
        result === 'error' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
      }`}>
        {result === true ? 'MATCHED' : result === false ? 'NO MATCH' : result === 'error' ? 'INVALID REGEX' : 'WAITING FOR INPUT'}
      </div>
    </div>
  );
};

const JsonFormatter = () => {
  const [input, setInput] = useState('');
  const formatted = useMemo(() => {
    if (!input) return '';
    try {
      return JSON.stringify(JSON.parse(input), null, 2);
    } catch { return 'Invalid JSON format'; }
  }, [input]);

  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-2xl font-bold">JSON Formatter</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea className="h-96 p-3 border rounded-lg font-mono text-xs" placeholder="Paste minified JSON..." onChange={e => setInput(e.target.value)} />
        <pre className="h-96 p-3 bg-slate-900 text-blue-300 rounded-lg overflow-auto text-xs leading-relaxed border border-slate-800">
          {formatted || "// Formatted JSON will appear here"}
        </pre>
      </div>
    </div>
  );
};

const UuidGenerator = ({ onCopy, copyStatus }: any) => {
  const [uuids, setUuids] = useState<string[]>([]);
  const generate = () => setUuids(Array.from({ length: 5 }, () => crypto.randomUUID()));

  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-2xl font-bold">UUID v4 Generator</h2>
      <button onClick={generate} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
        <RefreshCw size={18} /> Generate 5 UUIDs
      </button>
      <div className="space-y-2 mt-4">
        {uuids.map((u, i) => (
          <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center font-mono hover:border-indigo-300 transition-colors group">
            <span className="text-slate-600">{u}</span>
            <button onClick={() => onCopy(u, `uuid-${i}`)} className="text-slate-400 hover:text-indigo-600 p-1">
              {copyStatus === `uuid-${i}` ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const TimestampTool = () => {
  const [ts, setTs] = useState<string>(Math.floor(Date.now() / 1000).toString());
  const dateStr = useMemo(() => {
    const val = parseInt(ts);
    if (isNaN(val)) return 'Invalid Date';
    return new Date(val * 1000).toLocaleString();
  }, [ts]);

  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-2xl font-bold">Timestamp Converter</h2>
      <div className="flex gap-4">
        <input 
          type="number" 
          value={ts} 
          onChange={e => setTs(e.target.value)} 
          className="flex-1 p-3 border rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button onClick={() => setTs(Math.floor(Date.now() / 1000).toString())} className="px-6 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Current Now</button>
      </div>
      <div className="p-8 bg-indigo-600 rounded-2xl text-center shadow-xl shadow-indigo-100">
        <div className="text-indigo-200 text-xs uppercase tracking-[0.2em] font-bold">Local Date Time</div>
        <div className="text-3xl font-mono mt-2 text-white">{dateStr}</div>
      </div>
    </div>
  );
};

const PasswordGenerator = ({ onCopy, copyStatus }: any) => {
  const [pass, setPass] = useState('');
  const gen = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    const retVal = Array.from(crypto.getRandomValues(new Uint32Array(16)))
      .map((x) => charset[x % charset.length])
      .join('');
    setPass(retVal);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-2xl font-bold">Secure Password Generator</h2>
      <div className="flex gap-4">
        <input readOnly value={pass} className="flex-1 p-4 border rounded-xl font-mono text-xl bg-white" placeholder="Click generate..." />
        <button onClick={gen} className="bg-slate-900 text-white px-8 py-2 rounded-xl hover:bg-black transition-colors font-bold">Generate</button>
      </div>
      <div className="flex items-center justify-between p-4 bg-slate-100 rounded-lg">
        <span className="text-sm text-slate-500 font-medium">Strength: <span className="text-green-600">Strong (16 chars)</span></span>
        {pass && (
          <button onClick={() => onCopy(pass, 'pass')} className="flex items-center gap-2 text-indigo-600 font-bold hover:underline">
            <Copy size={16} /> Copy Password
          </button>
        )}
      </div>
    </div>
  );
};

export default DevToolbox;