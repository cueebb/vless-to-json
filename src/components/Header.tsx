import React from 'react';
import { ShieldCheck, FileCode, Terminal, Layers, Sparkles, Cpu, ToggleLeft, ToggleRight, Network } from 'lucide-react';
import { AppMode } from '../types';

interface HeaderProps {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  activeTab: 'convert' | 'merge' | 'json' | 'python';
  setActiveTab: (tab: 'convert' | 'merge' | 'json' | 'python') => void;
  parsedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  appMode,
  setAppMode,
  activeTab,
  setActiveTab,
  parsedCount
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between py-3.5 gap-4">
          
          {/* Top Left: Logo & Mode Switcher */}
          <div className="flex flex-wrap items-center gap-4">
            
            {/* App Brand */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">Xray Config Builder</h1>
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full">
                    Xray Core Ready
                  </span>
                </div>
              </div>
            </div>

            {/* TOP LEFT MODE TOGGLE SWITCH */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-indigo-500/30 shadow-inner">
              <button
                onClick={() => setAppMode('outbounds')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  appMode === 'outbounds'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Convert keys directly into Outbounds JSON array"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Outbounds Only</span>
              </button>

              <button
                onClick={() => setAppMode('inbounds')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  appMode === 'inbounds'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Generate only Inbounds JSON array for Xray (Ports 50000+)"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Inbounds Only</span>
              </button>

              <button
                onClick={() => setAppMode('full_config')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  appMode === 'full_config'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Multi-Port Inbound/Outbound Relay Mode with Full Xray JSON config (ports 50000+)"
              >
                <Network className="w-3.5 h-3.5" />
                <span>Full Relay Mode</span>
              </button>
            </div>

          </div>

          {/* Top Right: Navigation Tabs */}
          <nav className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs sm:text-sm">
            <button
              onClick={() => setActiveTab('convert')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'convert'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Keys Input ({parsedCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('merge')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'merge'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{appMode === 'full_config' ? 'Full Base Config' : 'Merge Base JSON'}</span>
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'json'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Full JSON Output</span>
            </button>

            <button
              onClick={() => setActiveTab('python')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'python'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Python Script</span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
};
