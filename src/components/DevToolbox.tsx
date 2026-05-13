import React, { useState } from 'react';
import {
  ShieldCheck,
  Columns,
  SearchCode,
  FileJson,
  Fingerprint,
  Clock,
  Lock,
  Check,
  ListFilter,
  Link2,
  ArrowLeftRight,
  Hash,
  Type,
  GitCompare,
  Binary,
<<<<<<< HEAD
  FolderDown,
=======
>>>>>>> f761e3c864e051762717208d45b8da34b4be24fb
} from 'lucide-react';

import JwtDecoder from './tools/JwtDecoder';
import ListComparator from './tools/ListComparator';
import RegexValidator from './tools/RegexValidator';
import JsonFormatter from './tools/JsonFormatter';
import JsonFieldExtractor from './tools/JsonFieldExtractor';
import JsonDiff from './tools/JsonDiff';
import PostmanBeautifier from './tools/PostmanBeautifier';
<<<<<<< HEAD
import PostmanParser from './tools/PostmanParser';
=======
>>>>>>> f761e3c864e051762717208d45b8da34b4be24fb
import PostmanResequencer from './tools/PostmanResequencer';
import UuidGenerator from './tools/UuidGenerator';
import TimestampTool from './tools/TimestampTool';
import PasswordGenerator from './tools/PasswordGenerator';
import FindDuplicates from './tools/FindDuplicates';
import UrlCombinationGenerator from './tools/UrlCombinationGenerator';
import Base64Tool from './tools/Base64Tool';
import HashGenerator from './tools/HashGenerator';
import TextCaseConverter from './tools/TextCaseConverter';
import NumberBaseConverter from './tools/NumberBaseConverter';

type ToolType =
  | 'jwt' | 'password'
  | 'base64' | 'hash'
<<<<<<< HEAD
  | 'postman-beautifier' | 'postman-resequencer' | 'postman-parser' | 'url-gen'
=======
  | 'postman-beautifier' | 'postman-resequencer' | 'url-gen'
>>>>>>> f761e3c864e051762717208d45b8da34b4be24fb
  | 'json' | 'json-extractor' | 'json-diff'
  | 'list-comp' | 'duplicates' | 'regex' | 'text-case'
  | 'uuid' | 'timestamp' | 'num-base';

const DevToolbox: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('jwt');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const toolGroups = [
    {
      title: 'Auth & Security',
      items: [
        { id: 'jwt',      label: 'JWT Decoder',    icon: ShieldCheck },
        { id: 'password', label: 'Password Gen',   icon: Lock },
        { id: 'hash',     label: 'Hash Generator', icon: Hash },
      ],
    },
    {
      title: 'Encoding',
      items: [
        { id: 'base64',   label: 'Base64',          icon: ArrowLeftRight },
        { id: 'num-base', label: 'Number Bases',    icon: Binary },
        { id: 'text-case',label: 'Case Converter',  icon: Type },
      ],
    },
    {
      title: 'Postman Tools',
      items: [
        { id: 'postman-beautifier',  label: 'Postman Beautifier',   icon: FileJson },
        { id: 'postman-resequencer', label: 'Postman Resequencer',  icon: ListFilter },
<<<<<<< HEAD
        { id: 'postman-parser',      label: 'Postman Parser',       icon: FolderDown },
=======
>>>>>>> f761e3c864e051762717208d45b8da34b4be24fb
        { id: 'url-gen',             label: 'URL Combinator',       icon: Link2 },
      ],
    },
    {
      title: 'JSON',
      items: [
        { id: 'json',           label: 'JSON Formatter', icon: FileJson },
        { id: 'json-extractor', label: 'JSON Extractor', icon: ListFilter },
        { id: 'json-diff',      label: 'JSON Diff',      icon: GitCompare },
      ],
    },
    {
      title: 'Lists & Text',
      items: [
        { id: 'list-comp',  label: 'List Comparator', icon: Columns },
        { id: 'duplicates', label: 'Find Duplicates',  icon: ListFilter },
        { id: 'regex',      label: 'Regex Validator',  icon: SearchCode },
      ],
    },
    {
      title: 'Generators',
      items: [
        { id: 'uuid',      label: 'UUID',      icon: Fingerprint },
        { id: 'timestamp', label: 'Timestamp', icon: Clock },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-100">
          <h1 className="text-lg font-bold text-indigo-600 flex items-center gap-2">
<<<<<<< HEAD
            <SearchCode size={22} /> Dev Tools
=======
            <SearchCode size={22} /> DevTools
>>>>>>> f761e3c864e051762717208d45b8da34b4be24fb
          </h1>
        </div>
        <nav className="flex-1 p-3 space-y-5 overflow-y-auto pt-5">
          {toolGroups.map((group) => (
            <div key={group.title} className="space-y-0.5">
              <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {group.title}
              </h3>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTool(item.id as ToolType)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left ${
                    activeTool === item.id
                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  <item.icon size={16} className="shrink-0" />
                  <span className="text-xs truncate">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          {activeTool === 'jwt'                && <JwtDecoder />}
          {activeTool === 'password'           && <PasswordGenerator onCopy={handleCopy} copyStatus={copyStatus} />}
          {activeTool === 'hash'               && <HashGenerator onCopy={handleCopy} copyStatus={copyStatus} />}
          {activeTool === 'base64'             && <Base64Tool onCopy={handleCopy} copyStatus={copyStatus} />}
          {activeTool === 'num-base'           && <NumberBaseConverter onCopy={handleCopy} copyStatus={copyStatus} />}
          {activeTool === 'text-case'          && <TextCaseConverter onCopy={handleCopy} copyStatus={copyStatus} />}
          {activeTool === 'postman-beautifier' && <PostmanBeautifier />}
          {activeTool === 'postman-resequencer'&& <PostmanResequencer />}
<<<<<<< HEAD
          {activeTool === 'postman-parser'     && <PostmanParser />}
=======
>>>>>>> f761e3c864e051762717208d45b8da34b4be24fb
          {activeTool === 'url-gen'            && <UrlCombinationGenerator onCopy={handleCopy} copyStatus={copyStatus} />}
          {activeTool === 'json'               && <JsonFormatter />}
          {activeTool === 'json-extractor'     && <JsonFieldExtractor onCopy={handleCopy} copyStatus={copyStatus} />}
          {activeTool === 'json-diff'          && <JsonDiff />}
          {activeTool === 'list-comp'          && <ListComparator />}
          {activeTool === 'duplicates'         && <FindDuplicates />}
          {activeTool === 'regex'              && <RegexValidator />}
          {activeTool === 'uuid'               && <UuidGenerator onCopy={handleCopy} copyStatus={copyStatus} />}
          {activeTool === 'timestamp'          && <TimestampTool />}
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
