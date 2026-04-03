import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Columns, 
  SearchCode, 
  FileJson, 
  Fingerprint, 
  Clock, 
  Lock,
  Check
} from 'lucide-react';

import JwtDecoder from './tools/JwtDecoder';
import ListComparator from './tools/ListComparator';
import RegexValidator from './tools/RegexValidator';
import JsonFormatter from './tools/JsonFormatter';
import UuidGenerator from './tools/UuidGenerator';
import TimestampTool from './tools/TimestampTool';
import PasswordGenerator from './tools/PasswordGenerator';

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

export default DevToolbox;
