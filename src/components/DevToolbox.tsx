import React, { useState, Suspense, lazy } from "react";
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
  FolderDown,
  Edit3,
  Users,
} from "lucide-react";

const JwtDecoder = lazy(() => import("./tools/JwtDecoder"));
const ListComparator = lazy(() => import("./tools/ListComparator"));
const RegexValidator = lazy(() => import("./tools/RegexValidator"));
const JsonFormatter = lazy(() => import("./tools/JsonFormatter"));
const JsonFieldExtractor = lazy(() => import("./tools/JsonFieldExtractor"));
const JsonDiff = lazy(() => import("./tools/JsonDiff"));
const PostmanBeautifyResequence = lazy(
  () => import("./tools/PostmanBeautifyResequence"),
);
const PostmanEditor = lazy(() => import("./tools/PostmanEditor"));
const PostmanParser = lazy(() => import("./tools/PostmanParser"));
const UuidGenerator = lazy(() => import("./tools/UuidGenerator"));
const TimestampTool = lazy(() => import("./tools/TimestampTool"));
const PasswordGenerator = lazy(() => import("./tools/PasswordGenerator"));
const FindDuplicates = lazy(() => import("./tools/FindDuplicates"));
const UrlCombinationGenerator = lazy(
  () => import("./tools/UrlCombinationGenerator"),
);
const Base64Tool = lazy(() => import("./tools/Base64Tool"));
const HashGenerator = lazy(() => import("./tools/HashGenerator"));
const TextCaseConverter = lazy(() => import("./tools/TextCaseConverter"));
const NumberBaseConverter = lazy(() => import("./tools/NumberBaseConverter"));
const TestPlayerGenerator = lazy(() => import("./tools/TestPlayerGenerator"));

type ToolType =
  | "jwt"
  | "password"
  | "base64"
  | "hash"
  | "postman-beautifier"
  | "postman-editor"
  | "postman-parser"
  | "url-gen"
  | "json"
  | "json-extractor"
  | "json-diff"
  | "list-comp"
  | "duplicates"
  | "regex"
  | "text-case"
  | "uuid"
  | "timestamp"
  | "num-base"
  | "test-player";

const DevToolbox: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>("jwt");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const toolGroups = [
    {
      title: "Jwt",
      items: [{ id: "jwt", label: "JWT Decoder", icon: ShieldCheck }],
    },
    {
      title: "JSON",
      items: [
        { id: "json", label: "JSON Formatter", icon: FileJson },
        { id: "json-extractor", label: "JSON Extractor", icon: ListFilter },
        { id: "json-diff", label: "JSON Comparison", icon: GitCompare },
      ],
    },
    {
      title: "Generators",
      items: [
        { id: "uuid", label: "UUID", icon: Fingerprint },
        { id: "timestamp", label: "Timestamp", icon: Clock },
        { id: "test-player", label: "Test Players", icon: Users },
        { id: "password", label: "Password", icon: Lock },
        { id: "hash", label: "Hash Generator", icon: Hash },
      ],
    },
    {
      title: "Postman Tools",
      items: [
        {
          id: "postman-beautifier",
          label: "Postman Beautifier",
          icon: FileJson,
        },
        { id: "postman-editor", label: "Postman Editor", icon: Edit3 },
        { id: "postman-parser", label: "Postman Parser", icon: FolderDown },
      ],
    },
    {
      title: "Lists & Others",
      items: [
        { id: "list-comp", label: "List Comparator", icon: Columns },
        { id: "duplicates", label: "Find Duplicates", icon: ListFilter },
        { id: "url-gen", label: "URL Combinator", icon: Link2 },
        { id: "regex", label: "Regex Validator", icon: SearchCode },
      ],
    },
    {
      title: "Encoding",
      items: [
        { id: "base64", label: "Base64", icon: ArrowLeftRight },
        { id: "num-base", label: "Number Bases", icon: Binary },
        { id: "text-case", label: "Case Converter", icon: Type },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white shadow-md flex flex-col shrink-0">
        <div className="px-5 py-6 bg-gradient-to-br from-indigo-600 to-violet-600">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <SearchCode size={24} />
            Dev Tools
          </h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {toolGroups.map((group) => (
            <div key={group.title}>
              <h3 className="px-3 text-sm font-semibold text-slate-400 uppercase tracking-widest mb-1">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTool(item.id as ToolType)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left ${
                      activeTool === item.id
                        ? "bg-indigo-50 text-indigo-700 font-semibold shadow-sm ring-1 ring-indigo-100"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <item.icon
                      size={17}
                      className={`shrink-0 ${activeTool === item.id ? "text-indigo-500" : "text-slate-400"}`}
                    />
                    <span className="text-sm truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-slate-100">
        <div className="max-w-4xl mx-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                Loading…
              </div>
            }
          >
            {activeTool === "jwt" && <JwtDecoder />}
            {activeTool === "password" && (
              <PasswordGenerator onCopy={handleCopy} copyStatus={copyStatus} />
            )}
            {activeTool === "hash" && (
              <HashGenerator onCopy={handleCopy} copyStatus={copyStatus} />
            )}
            {activeTool === "base64" && (
              <Base64Tool onCopy={handleCopy} copyStatus={copyStatus} />
            )}
            {activeTool === "num-base" && (
              <NumberBaseConverter
                onCopy={handleCopy}
                copyStatus={copyStatus}
              />
            )}
            {activeTool === "text-case" && (
              <TextCaseConverter onCopy={handleCopy} copyStatus={copyStatus} />
            )}
            {activeTool === "postman-beautifier" && (
              <PostmanBeautifyResequence />
            )}
            {activeTool === "postman-editor" && <PostmanEditor />}
            {activeTool === "postman-parser" && <PostmanParser />}
            {activeTool === "url-gen" && (
              <UrlCombinationGenerator
                onCopy={handleCopy}
                copyStatus={copyStatus}
              />
            )}
            {activeTool === "json" && <JsonFormatter />}
            {activeTool === "json-extractor" && (
              <JsonFieldExtractor onCopy={handleCopy} copyStatus={copyStatus} />
            )}
            {activeTool === "json-diff" && <JsonDiff />}
            {activeTool === "list-comp" && <ListComparator />}
            {activeTool === "duplicates" && <FindDuplicates />}
            {activeTool === "regex" && <RegexValidator />}
            {activeTool === "uuid" && (
              <UuidGenerator onCopy={handleCopy} copyStatus={copyStatus} />
            )}
            {activeTool === "timestamp" && <TimestampTool />}
            {activeTool === "test-player" && (
              <TestPlayerGenerator
                onCopy={handleCopy}
                copyStatus={copyStatus}
              />
            )}
          </Suspense>
        </div>
      </main>

      {/* Global Toast */}
      {copyStatus && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium">
          <Check size={15} className="text-emerald-400" /> Copied to clipboard
        </div>
      )}
    </div>
  );
};

export default DevToolbox;
