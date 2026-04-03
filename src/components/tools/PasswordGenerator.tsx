import React, { useState } from 'react';
import { Copy } from 'lucide-react';

interface PasswordGeneratorProps {
  onCopy: (text: string, id: string) => void;
  copyStatus: string | null;
}

const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onCopy }) => {
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

export default PasswordGenerator;
