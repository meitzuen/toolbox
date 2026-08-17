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
  Wand2,
  Link2,
  ArrowLeftRight,
  Hash,
  Type,
  GitCompare,
  Binary,
  FolderDown,
  Edit3,
  Users,
  ChevronDown,
  ImagePlus,
  Percent,
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
const ListPrettifier = lazy(() => import("./tools/ListPrettifier"));
const UrlCombinationGenerator = lazy(
  () => import("./tools/UrlCombinationGenerator"),
);
const Base64Tool = lazy(() => import("./tools/Base64Tool"));
const HashGenerator = lazy(() => import("./tools/HashGenerator"));
const TextCaseConverter = lazy(() => import("./tools/TextCaseConverter"));
const NumberBaseConverter = lazy(() => import("./tools/NumberBaseConverter"));
const TestPlayerGenerator = lazy(() => import("./tools/TestPlayerGenerator"));
const ImagePlaceholderGenerator = lazy(
  () => import("./tools/ImagePlaceholderGenerator"),
);
const UrlEncoderDecoder = lazy(() => import("./tools/UrlEncoderDecoder"));

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
  | "list-pretty"
  | "regex"
  | "text-case"
  | "uuid"
  | "timestamp"
  | "num-base"
  | "test-player"
  | "image-gen"
  | "url-encode";

const DevToolbox: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>("jwt");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const toolGroups = [
    {
      title: "JWT",
      color: "#b5895a",
      items: [{ id: "jwt", label: "JWT Decoder", icon: ShieldCheck }],
    },
    {
      title: "JSON",
      color: "#4caf50",
      items: [
        { id: "json", label: "JSON Formatter", icon: FileJson },
        { id: "json-extractor", label: "JSON Extractor", icon: ListFilter },
        { id: "json-diff", label: "JSON Comparison", icon: GitCompare },
      ],
    },
    {
      title: "Generators",
      color: "#2196f3",
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
      color: "#e53935",
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
      color: "#ff9800",
      items: [
        { id: "list-comp", label: "List Comparator", icon: Columns },
        { id: "duplicates", label: "Find Duplicates", icon: ListFilter },
        { id: "list-pretty", label: "List Prettifier", icon: Wand2 },
        { id: "url-gen", label: "URL Combinator", icon: Link2 },
        { id: "regex", label: "Regex Validator", icon: SearchCode },
      ],
    },
    {
      title: "Encoding",
      color: "#9c27b0",
      items: [
        { id: "base64", label: "Base64", icon: ArrowLeftRight },
        { id: "url-encode", label: "URL Encoder / Decoder", icon: Percent },
        { id: "num-base", label: "Number Bases", icon: Binary },
        { id: "text-case", label: "Case Converter", icon: Type },
      ],
    },
    {
      title: "Images",
      color: "#06b6d4",
      items: [
        { id: "image-gen", label: "Test Image Generator", icon: ImagePlus },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e1e1e] flex flex-col shrink-0">
        <div className="px-5 py-5 bg-gradient-to-br from-indigo-600 to-violet-600">
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <SearchCode size={22} />
            Dev Tools
          </h1>
        </div>
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {toolGroups.map((group, index) => {
            const isCollapsed = collapsedGroups.has(group.title);
            return (
            <div key={group.title}>
              {index !== 0 && (
                <div className="mx-2 my-2 border-t border-white/10" />
              )}
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 mb-0.5 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronDown
                  size={13}
                  className={`text-gray-500 shrink-0 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  {group.title}
                </span>
              </button>
              {!isCollapsed && (
                <div>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTool(item.id as ToolType)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-100 text-left ${
                        activeTool === item.id
                          ? "bg-white/10 text-white"
                          : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-sm shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-sm truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            );
          })}
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
            {activeTool === "json" && (
              <JsonFormatter onCopy={handleCopy} copyStatus={copyStatus} />
            )}
            {activeTool === "json-extractor" && (
              <JsonFieldExtractor onCopy={handleCopy} copyStatus={copyStatus} />
            )}
            {activeTool === "json-diff" && <JsonDiff />}
            {activeTool === "list-comp" && <ListComparator />}
            {activeTool === "duplicates" && <FindDuplicates />}
            {activeTool === "list-pretty" && (
              <ListPrettifier onCopy={handleCopy} copyStatus={copyStatus} />
            )}
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
            {activeTool === "image-gen" && <ImagePlaceholderGenerator />}
            {activeTool === "url-encode" && (
              <UrlEncoderDecoder onCopy={handleCopy} copyStatus={copyStatus} />
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
