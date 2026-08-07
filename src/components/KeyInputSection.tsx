import React, { useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Layers, Settings2, Network } from 'lucide-react';
import { AppMode, FormatMode, InboundProtocol, ConversionStats } from '../types';

interface KeyInputSectionProps {
  appMode: AppMode;
  rawKeysText: string;
  setRawKeysText: (text: string) => void;
  formatMode: FormatMode;
  setFormatMode: (mode: FormatMode) => void;
  startPort: number;
  setStartPort: (port: number) => void;
  inboundProtocol: InboundProtocol;
  setInboundProtocol: (proto: InboundProtocol) => void;
  stats: ConversionStats;
  onLoadSampleKeys: () => void;
  onClear: () => void;
}

export const KeyInputSection: React.FC<KeyInputSectionProps> = ({
  appMode,
  rawKeysText,
  setRawKeysText,
  formatMode,
  setFormatMode,
  startPort,
  setStartPort,
  inboundProtocol,
  setInboundProtocol,
  stats,
  onLoadSampleKeys,
  onClear
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawKeysText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Controls */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
          <div>
            <h2 className="text-lg font-semibold text-slate-100 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Input VLESS & Proxy Keys (.txt or Paste)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Paste keys line-by-line or upload a <code className="text-indigo-300">.txt</code> file containing VLESS / REALITY / xHTTP / WS / gRPC links.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onLoadSampleKeys}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load 100 Sample Keys</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center space-x-1.5 border border-slate-600"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Upload .txt File</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.key,.link"
              className="hidden"
            />

            {rawKeysText && (
              <button
                onClick={onClear}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-medium transition-colors border border-rose-500/20"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Mode Specific Settings Row */}
        {appMode === 'full_config' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-emerald-500/30 text-xs">
            
            {/* Start Port Input */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-300 font-medium shrink-0">Inbound Start Port:</span>
              <input
                type="number"
                value={startPort}
                onChange={(e) => setStartPort(parseInt(e.target.value, 10) || 50000)}
                min={1024}
                max={65000}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-emerald-300 font-mono font-bold w-24 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400">Range: {startPort} - {startPort + Math.max(0, stats.parsedKeys - 1)}</span>
            </div>

            {/* Inbound Protocol Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-300 font-medium shrink-0">Inbound Protocol:</span>
              <select
                value={inboundProtocol}
                onChange={(e) => setInboundProtocol(e.target.value as InboundProtocol)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="vless">VLESS (Reference Config)</option>
                <option value="socks">SOCKS5</option>
                <option value="http">HTTP</option>
                <option value="mixed">Mixed (SOCKS/HTTP)</option>
                <option value="dokodemo-door">dokodemo-door</option>
              </select>
            </div>

            {/* Format Mode */}
            <div className="flex items-center space-x-2 justify-end">
              <span className="text-slate-300 font-medium shrink-0">Outbound Format:</span>
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-700">
                <button
                  onClick={() => setFormatMode('flat')}
                  className={`px-2 py-0.5 rounded font-medium text-[11px] ${formatMode === 'flat' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Flat
                </button>
                <button
                  onClick={() => setFormatMode('vnext')}
                  className={`px-2 py-0.5 rounded font-medium text-[11px] ${formatMode === 'vnext' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  vnext
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* Format Selector Toggle */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-300 font-medium">
              <Settings2 className="w-4 h-4 text-indigo-400" />
              <span>Output Outbounds Format:</span>
            </div>

            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setFormatMode('flat')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  formatMode === 'flat'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="User Prompt Example style: settings has address, port, id, encryption, flow"
              >
                Flat Settings (Prompt Example)
              </button>

              <button
                onClick={() => setFormatMode('vnext')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  formatMode === 'vnext'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Standard Xray core format: settings.vnext array"
              >
                Standard Xray (vnext)
              </button>
            </div>
          </div>
        )}

        {/* Text Area for Input Keys */}
        <div className="relative">
          <textarea
            value={rawKeysText}
            onChange={(e) => setRawKeysText(e.target.value)}
            rows={10}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
          />
        </div>

        {/* Live Parsing Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Total Lines</span>
              <span className="text-lg font-bold text-slate-100">{stats.totalLines}</span>
            </div>
            <Layers className="w-5 h-5 text-slate-500" />
          </div>

          <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-400 uppercase tracking-wider block font-medium">
                {appMode === 'full_config' ? 'Inbounds + Outbounds' : 'Parsed Keys'}
              </span>
              <span className="text-lg font-bold text-emerald-300">{stats.parsedKeys}</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="bg-amber-950/20 p-3 rounded-xl border border-amber-500/20 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-400 uppercase tracking-wider block font-medium">Protocols</span>
              <div className="text-xs font-semibold text-slate-200 mt-0.5">
                {Object.entries(stats.protocols).map(([p, count]) => `${p.toUpperCase()} (${count})`).join(', ') || 'None'}
              </div>
            </div>
          </div>

          <div className="bg-indigo-950/20 p-3 rounded-xl border border-indigo-500/20 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-indigo-300 uppercase tracking-wider block font-medium">Networks</span>
              <div className="text-xs font-semibold text-indigo-200 mt-0.5">
                {Object.entries(stats.networks).map(([net, count]) => `${net.toUpperCase()} (${count})`).join(', ') || 'None'}
              </div>
            </div>
          </div>
        </div>

        {stats.invalidKeys > 0 && (
          <div className="flex items-center space-x-2 text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{stats.invalidKeys} line(s) could not be parsed as valid proxy URLs and were skipped.</span>
          </div>
        )}

      </div>
    </div>
  );
};
