import React, { useState } from 'react';
import { Layers, FileJson, Check, AlertTriangle, Plus, Trash2, ArrowRightLeft } from 'lucide-react';
import { getDefaultBaseOutbounds } from '../utils/vlessParser';

interface MergeConfigSectionProps {
  baseJsonText: string;
  setBaseJsonText: (text: string) => void;
  includeBaseRules: boolean;
  setIncludeBaseRules: (include: boolean) => void;
  parsedKeysCount: number;
}

export const MergeConfigSection: React.FC<MergeConfigSectionProps> = ({
  baseJsonText,
  setBaseJsonText,
  includeBaseRules,
  setIncludeBaseRules,
  parsedKeysCount
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleResetDefaultBase = () => {
    const defaults = getDefaultBaseOutbounds();
    setBaseJsonText(JSON.stringify(defaults, null, 2));
    setErrorMsg(null);
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setBaseJsonText(text);
    if (!text.trim()) {
      setErrorMsg(null);
      return;
    }
    try {
      JSON.parse(text);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid JSON syntax');
    }
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Base Outbounds & Merging Config</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Specify existing base outbounds (e.g., <code className="text-emerald-400">direct</code> and <code className="text-rose-400">blocked</code> rules) to merge with your newly converted {parsedKeysCount} keys.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetDefaultBase}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-xl transition-colors border border-slate-600 flex items-center space-x-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
            <span>Reset to Standard Direct & Blocked</span>
          </button>
        </div>
      </div>

      {/* Include Default Base Toggle */}
      <div className="flex items-center justify-between bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="includeBase"
            checked={includeBaseRules}
            onChange={(e) => setIncludeBaseRules(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded bg-slate-800 border-slate-600 focus:ring-indigo-500"
          />
          <label htmlFor="includeBase" className="text-xs text-slate-200 font-medium cursor-pointer">
            Include base rules (<code className="text-emerald-400">direct</code> freedom & <code className="text-rose-400">blocked</code> blackhole) at the beginning of the merged outbounds array
          </label>
        </div>

        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          includeBaseRules ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'
        }`}>
          {includeBaseRules ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {/* Base JSON Editor */}
      {includeBaseRules && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-medium flex items-center space-x-1.5">
              <FileJson className="w-4 h-4 text-indigo-400" />
              <span>Existing / Base JSON Array</span>
            </span>
            <span className="text-slate-400">Editable JSON array</span>
          </div>

          <textarea
            value={baseJsonText}
            onChange={handleJsonChange}
            rows={8}
            className={`w-full bg-slate-950/90 border rounded-xl p-4 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 ${
              errorMsg ? 'border-rose-500/80 focus:ring-rose-500/50' : 'border-slate-700/80 focus:ring-indigo-500/50'
            }`}
            placeholder='[\n  {\n    "tag": "direct",\n    "protocol": "freedom"\n  }\n]'
          />

          {errorMsg ? (
            <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>JSON Error: {errorMsg}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-emerald-400">
              <Check className="w-4 h-4 shrink-0" />
              <span>Valid JSON base structure ready for merging.</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
