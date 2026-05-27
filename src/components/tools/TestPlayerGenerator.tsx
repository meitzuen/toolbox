import React, { useState, useMemo } from 'react';
import { Copy, Check, RefreshCw, Download, Users } from 'lucide-react';

interface TestPlayerGeneratorProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

type GameType = 'rpg' | 'fps' | 'sports';
type OutputFormat = 'json-array' | 'json-objects' | 'csv';

const FIRST_NAMES = [
  'Alex','Blake','Casey','Dana','Eli','Finn','Grey','Hunter',
  'Indie','Jade','Kai','Logan','Morgan','Noel','Owen','Parker',
  'Quinn','Riley','Sage','Taylor','Uma','Valor','Wren','Xander',
  'Yuki','Zane','Aria','Blaze','Cyan','Drew',
];
const LAST_NAMES = [
  'Storm','Frost','Drake','Stone','Vale','Cross','Marsh','Riven',
  'Vex','Blunt','Crest','Dunn','Edge','Flair','Grim','Holt',
  'Iris','Jade','Knox','Lark','Mire','Nash','Orion','Pike',
  'Quest','Raze','Swift','Thorn','Ulric','Vane',
];
const ADJECTIVES = ['Shadow','Iron','Neon','Void','Crimson','Silver','Ghost','Titan','Apex','Storm'];
const NOUNS = ['Wolf','Hawk','Blade','Viper','Fox','Raven','Bear','Tiger','Lion','Eagle'];
const RPG_CLASSES = ['Warrior','Mage','Rogue','Paladin','Ranger','Necromancer','Druid','Bard','Monk','Shaman'];
const RPG_RACES = ['Human','Elf','Dwarf','Orc','Halfling','Tiefling','Gnome','Dragonborn'];
const GUILDS = ['Iron Legion','Shadow Pact','Arcane Order','Crimson Tide','Silver Vanguard','Void Walkers'];
const FPS_RANKS = ['Bronze','Silver','Gold','Platinum','Diamond','Master','Grandmaster','Challenger'];
const FPS_REGIONS = ['NA','EU','APAC','SA','OCE','ME'];
const SPORTS_POSITIONS_SOCCER = ['GK','CB','LB','RB','CDM','CM','CAM','LW','RW','ST'];
const SPORTS_POSITIONS_BASKETBALL = ['PG','SG','SF','PF','C'];
const COUNTRIES = ['USA','GBR','BRA','DEU','FRA','JPN','KOR','AUS','CAN','ESP','ITA','NLD','SWE','MEX','ARG'];
const TEAMS_SOCCER = ['Red Lions','Blue Eagles','Green Wolves','Black Panthers','White Knights','Gold Tigers'];
const TEAMS_BASKETBALL = ['Thunder','Blaze','Storm','Fury','Rockets','Sharks','Vipers','Hawks'];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function genUsername() {
  return `${pick(ADJECTIVES)}${pick(NOUNS)}${rand(1, 9999)}`;
}
function isoDate(yearsBack: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - rand(0, yearsBack));
  d.setMonth(rand(0, 11));
  d.setDate(rand(1, 28));
  return d.toISOString().split('T')[0];
}

function genRPGPlayer(index: number) {
  const level = rand(1, 100);
  return {
    id: index + 1,
    username: genUsername(),
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    level,
    xp: rand(level * 800, level * 2000),
    hp: rand(50, 500),
    mana: rand(0, 300),
    class: pick(RPG_CLASSES),
    race: pick(RPG_RACES),
    guild: Math.random() > 0.3 ? pick(GUILDS) : null,
    joinDate: isoDate(4),
    status: pick(['active', 'active', 'active', 'inactive', 'banned']),
  };
}

function genFPSPlayer(index: number) {
  const kills = rand(500, 30000);
  const deaths = rand(400, 25000);
  const wins = rand(20, 2000);
  return {
    id: index + 1,
    username: genUsername(),
    rank: pick(FPS_RANKS),
    rankPoints: rand(0, 10000),
    kills,
    deaths,
    assists: rand(300, kills),
    kdr: parseFloat((kills / Math.max(deaths, 1)).toFixed(2)),
    wins,
    losses: rand(10, wins + 200),
    accuracy: parseFloat((rand(15, 65) + Math.random()).toFixed(1)),
    headshots: rand(5, 45),
    region: pick(FPS_REGIONS),
    joinDate: isoDate(5),
    status: pick(['online', 'online', 'offline', 'in-game', 'away']),
  };
}

function genSportsPlayer(index: number) {
  const isSoccer = Math.random() > 0.5;
  const matches = rand(10, 300);
  return {
    id: index + 1,
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    jerseyNumber: rand(1, 99),
    sport: isSoccer ? 'Soccer' : 'Basketball',
    position: isSoccer ? pick(SPORTS_POSITIONS_SOCCER) : pick(SPORTS_POSITIONS_BASKETBALL),
    team: isSoccer ? pick(TEAMS_SOCCER) : pick(TEAMS_BASKETBALL),
    country: pick(COUNTRIES),
    age: rand(17, 38),
    matches,
    goals: rand(0, Math.floor(matches * 0.6)),
    assists: rand(0, Math.floor(matches * 0.5)),
    rating: parseFloat((rand(50, 99) + Math.random()).toFixed(1)),
    status: pick(['active', 'active', 'injured', 'suspended']),
  };
}

function generatePlayers(count: number, gameType: GameType) {
  return Array.from({ length: count }, (_, i) => {
    if (gameType === 'rpg')  return genRPGPlayer(i);
    if (gameType === 'fps')  return genFPSPlayer(i);
    return genSportsPlayer(i);
  });
}

function toCSV(players: Record<string, unknown>[]): string {
  if (!players.length) return '';
  const headers = Object.keys(players[0]);
  const rows = players.map(p =>
    headers.map(h => {
      const val = p[h];
      if (val === null) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function formatOutput(players: Record<string, unknown>[], fmt: OutputFormat): string {
  if (fmt === 'csv')          return toCSV(players);
  if (fmt === 'json-objects') return players.map(p => JSON.stringify(p, null, 2)).join('\n\n');
  return JSON.stringify(players, null, 2);
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const TestPlayerGenerator: React.FC<TestPlayerGeneratorProps> = ({ onCopy, copyStatus }) => {
  const [count, setCount] = useState(5);
  const [gameType, setGameType] = useState<GameType>('rpg');
  const [format, setFormat] = useState<OutputFormat>('json-array');
  const [players, setPlayers] = useState<Record<string, unknown>[]>([]);

  const output = useMemo(() => {
    if (!players.length) return '';
    return formatOutput(players, format);
  }, [players, format]);

  const generate = () => setPlayers(generatePlayers(count, gameType));

  const handleDownload = () => {
    const ext = format === 'csv' ? 'csv' : 'json';
    const mime = format === 'csv' ? 'text/csv' : 'application/json';
    downloadFile(output, `test-players.${ext}`, mime);
  };

  const gameTypes: { id: GameType; label: string; desc: string }[] = [
    { id: 'rpg',    label: 'RPG',    desc: 'Level, class, race, guild, XP' },
    { id: 'fps',    label: 'FPS',    desc: 'Rank, KDR, accuracy, region' },
    { id: 'sports', label: 'Sports', desc: 'Soccer/Basketball, goals, rating' },
  ];

  const formats: { id: OutputFormat; label: string }[] = [
    { id: 'json-array',   label: 'JSON Array' },
    { id: 'json-objects', label: 'JSON Objects' },
    { id: 'csv',          label: 'CSV' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Test Player Generator</h2>
        <Users className="text-indigo-500" size={32} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        {/* Count slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">Player Count</label>
            <span className="text-2xl font-bold font-mono text-indigo-600">{count}</span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={count}
            onChange={e => setCount(+e.target.value)}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>1</span><span>10</span><span>25</span><span>50</span>
          </div>
        </div>

        {/* Game type */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Game Type</label>
          <div className="grid grid-cols-3 gap-2">
            {gameTypes.map(g => (
              <button
                key={g.id}
                onClick={() => setGameType(g.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  gameType === g.id
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="font-semibold text-sm">{g.label}</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-tight">{g.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Output format */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Output Format</label>
          <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
            {formats.map(f => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  format === f.id
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={generate}
        className="w-full bg-indigo-600 text-white py-3 px-8 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition-all font-bold flex items-center justify-center gap-2"
      >
        <RefreshCw size={18} /> Generate Players
      </button>

      {output && (
        <div className="bg-slate-900 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-800/50 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              {count} player{count !== 1 ? 's' : ''} · {gameType.toUpperCase()} · {format === 'csv' ? 'CSV' : 'JSON'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <Download size={14} /> Download
              </button>
              <div className="w-px h-4 bg-slate-600" />
              <button
                onClick={() => onCopy(output, 'player-output')}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  copyStatus === 'player-output' ? 'text-green-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                {copyStatus === 'player-output'
                  ? <><Check size={14} /> Copied!</>
                  : <><Copy size={14} /> Copy</>}
              </button>
            </div>
          </div>
          <pre className="p-4 text-xs text-blue-300/90 font-mono overflow-x-auto max-h-[480px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestPlayerGenerator;
