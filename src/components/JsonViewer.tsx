import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, CheckCircle2, Network } from 'lucide-react';
import { AppMode, XrayOutbound } from '../types';

interface JsonViewerProps {
  appMode: AppMode;
  outbounds: XrayOutbound[];
  fullConfig: any;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ appMode, outbounds, fullConfig }) => {
  const [copied, setCopied] = useState(false);

  const displayData = appMode === 'full_config' ? fullConfig : outbounds;
  const jsonFormatted = JSON.stringify(displayData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonFormatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const fileName = appMode === 'full_config' ? 'config.json' : 'outbounds.json';
    const blob = new Blob([jsonFormatted], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center space-x-2">
            {appMode === 'full_config' ? (
              <Network className="w-5 h-5 text-emerald-400" />
            ) : (
              <FileCode className="w-5 h-5 text-indigo-400" />
            )}
            <span>
              {appMode === 'full_config'
                ? 'Full Multi-Port Relay Xray JSON Config'
                : 'Generated Xray JSON Outbounds'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {appMode === 'full_config' ? (
              <>
                Contains <span className="text-emerald-300 font-semibold">{fullConfig?.inbounds?.length || 0} Inbounds (Ports 50000+)</span>,{' '}
                <span className="text-indigo-300 font-semibold">{outbounds.length} Outbounds</span> & 1-to-1 Routing Rules.
              </>
            ) : (
              <>
                Total <span className="text-indigo-300 font-semibold">{outbounds.length} outbounds</span> formatted for Xray core config.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-xl transition-colors border border-slate-600 flex items-center space-x-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>Copy {appMode === 'full_config' ? 'Full Config JSON' : 'Outbounds JSON'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className={`px-3.5 py-2 text-white text-xs font-medium rounded-xl transition-colors shadow-sm flex items-center space-x-1.5 ${
              appMode === 'full_config' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {appMode === 'full_config' ? 'config.json' : 'outbounds.json'}</span>
          </button>
        </div>
      </div>

      {/* Formatted JSON Output Display */}
      <div className="relative">
        <textarea
          readOnly
          value={jsonFormatted}
          rows={18}
          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-4 text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none custom-scrollbar"
        />
      </div>

      <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          {appMode === 'full_config'
            ? 'Full Xray server configuration ready. Run directly with `xray -config config.json`.'
            : 'Ready to be loaded into Xray core, v2rayN, Nekoray, PassWall, Sing-Box, or custom proxy clients.'}
        </span>
      </div>

    </div>
  );
};
