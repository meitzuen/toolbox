// Filename: DevToolbox.tsx
import React, { useState, useMemo, useCallback } from 'react';
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

// --- Components ---

const DevToolbox: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('jwt');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderTool = () => {
    switch (activeTool) {
      case 'jwt': return <JwtDecoder />;
      case 'list-comp': return <ListComparator />;
      case 'regex': return <RegexValidator />;
      case 'json': return <JsonFormatter />;
      case 'uuid': return <UuidGenerator />;
      case 'timestamp': return <TimestampTool />;
      case 'password': return <PasswordGenerator />;
      default: return null;
    }
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
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <SearchCode size={24} /> DevTools
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
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
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          {renderTool()}
        </div>
      </main>

      {/* Toast Notification */}
      {copied && (
        <div className="fixed bottom-8 right-8 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
          <Check size={16} /> Copied to clipboard!
        </div>
      )}
    </div>
  );
};

// --- Tool Modules ---

const JwtDecoder = () => {
  const [input, setInput] = useState('');
  const decoded = useMemo(() => {
    try {
      const parts = input.split('.');
      if (parts.length !== 3) return null;
      return JSON.stringify(JSON.parse(atob(parts[1])), null, 2);
    } catch { return 'Invalid JWT'; }
  }, [input]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">JWT Decoder</h2>
      <textarea 
        className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
        placeholder="Paste your JWT here..."
        onChange={(e) => setInput(e.target.value)}
      />
      <pre className="p-4 bg-slate-900 text-green-400 rounded-xl overflow-x-auto min-h-[200px]">
        {decoded || "// Decoded payload will appear here"}
      </pre>
    </div>
  );
};

const ListComparator = () => {
  const [listA, setListA] = useState('');
  const [listB, setListB] = useState('');
  
  const diff = useMemo(() => {
    const a = listA.split('\n').filter(Boolean).map(i => i.trim());
    const b = listB.split('\n').filter(Boolean).map(i => i.trim());
    return {
      onlyA: a.filter(x => !b.includes(x)),
      onlyB: b.filter(x => !a.includes(x)),
      intersection: a.filter(x => b.includes(x))
    };
  }, [listA, listB]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">List Comparator</h2>
      <div className="grid grid-cols-2 gap-4">
        <textarea placeholder="List A (one per line)" className="h-40 p-3 border rounded-lg font-mono" onChange={e => setListA(e.target.value)} />
        <textarea placeholder="List B (one per line)" className="h-40 p-3 border rounded-lg font-mono" onChange={e => setListB(e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-red-50 rounded-lg">
          <h4 className="font-bold text-red-700 mb-2">Only in A ({diff.onlyA.length})</h4>
          <div className="text-xs font-mono">{diff.onlyA.join(', ')}</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-bold text-blue-700 mb-2">Common ({diff.intersection.length})</h4>
          <div className="text-xs font-mono">{diff.intersection.join(', ')}</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-bold text-green-700 mb-2">Only in B ({diff.onlyB.length})</h4>
          <div className="text-xs font-mono">{diff.onlyB.join(', ')}</div>
        </div>
      </div>
    </div>
  );
};

const RegexValidator = () => {
  const [regex, setRegex] = useState('');
  const [testString, setTestString] = useState('');
  const isMatch = useMemo(() => {
    try {
      const re = new RegExp(regex);
      return re.test(testString);
    } catch { return false; }
  }, [regex, testString]);

  return (
    <div className="space-y-4">
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
      <div className={`p-4 rounded-lg font-bold text-center ${isMatch ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {isMatch ? 'MATCHED' : 'NO MATCH'}
      </div>
    </div>
  );
};

const JsonFormatter = () => {
  const [input, setInput] = useState('');
  const formatted = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(input), null, 2);
    } catch { return 'Invalid JSON'; }
  }, [input]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">JSON Formatter</h2>
      <div className="grid grid-cols-2 gap-4">
        <textarea className="h-96 p-3 border rounded-lg font-mono text-xs" placeholder="Minified JSON..." onChange={e => setInput(e.target.value)} />
        <pre className="h-96 p-3 bg-slate-900 text-blue-300 rounded-lg overflow-auto text-xs">{formatted}</pre>
      </div>
    </div>
  );
};

const UuidGenerator = () => {
  const [uuids, setUuids] = useState<string[]>([]);
  const generate = () => {
    const newUuids = Array.from({ length: 5 }, () => crypto.randomUUID());
    setUuids(newUuids);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">UUID v4 Generator</h2>
      <button onClick={generate} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
        <RefreshCw size={18} /> Generate 5 UUIDs
      </button>
      <div className="space-y-2">
        {uuids.map(u => (
          <div key={u} className="p-3 bg-white border rounded flex justify-between items-center font-mono">
            {u}
            <button onClick={() => navigator.clipboard.writeText(u)} className="text-slate-400 hover:text-indigo-600"><Copy size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const TimestampTool = () => {
  const [ts, setTs] = useState<string>(Math.floor(Date.now() / 1000).toString());
  const dateStr = useMemo(() => new Date(parseInt(ts) * 1000).toLocaleString(), [ts]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Timestamp Converter</h2>
      <div className="flex gap-4">
        <input 
          type="number" 
          value={ts} 
          onChange={e => setTs(e.target.value)} 
          className="flex-1 p-3 border rounded-lg font-mono"
        />
        <button onClick={() => setTs(Math.floor(Date.now() / 1000).toString())} className="px-4 py-2 border rounded-lg">Now</button>
      </div>
      <div className="p-6 bg-indigo-50 rounded-xl text-center">
        <div className="text-sm text-indigo-500 uppercase tracking-wider font-bold">Local Time</div>
        <div className="text-3xl font-mono mt-2">{dateStr}</div>
      </div>
    </div>
  );
};

const PasswordGenerator = () => {
  const [pass, setPass] = useState('');
  const gen = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0; i < 16; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPass(retVal);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Password Generator</h2>
      <div className="flex gap-4">
        <input readOnly value={pass} className="flex-1 p-3 border rounded-lg font-mono text-xl" placeholder="Generated password..." />
        <button onClick={gen} className="bg-slate-800 text-white px-6 py-2 rounded-lg">Generate</button>
      </div>
      <p className="text-sm text-slate-500">Length: 16 characters (Includes Symbols, Numbers, Mixed Case)</p>
    </div>
  );
};

export default DevToolbox;