import React, { useState, useMemo } from 'react';

const ResultBox: React.FC<{ title: string; data: string[]; color: 'red' | 'blue' | 'green' }> = ({ title, data, color }) => (
  <div className={`p-4 rounded-lg border ${color === 'red' ? 'bg-red-50 border-red-100' : color === 'blue' ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
    <h4 className={`font-bold mb-2 ${color === 'red' ? 'text-red-700' : color === 'blue' ? 'text-blue-700' : 'text-green-700'}`}>{title} ({data.length})</h4>
    <div className="text-xs font-mono max-h-40 overflow-y-auto break-all">
      {data.length > 0 ? data.join('\n') : <span className="opacity-50 italic">None</span>}
    </div>
  </div>
);

const ListComparator: React.FC = () => {
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

export default ListComparator;
