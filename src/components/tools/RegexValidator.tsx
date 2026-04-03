import React, { useState, useMemo } from 'react';

const RegexValidator: React.FC = () => {
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

export default RegexValidator;
