import React from 'react';
import { ShieldCheck, FileCode, Terminal, Layers, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'convert' | 'merge' | 'json' | 'python';
  setActiveTab: (tab: 'convert' | 'merge' | 'json' | 'python') => void;
  parsedCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, parsedCount }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
          
          {/* Logo & App Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">VLESS to Xray Converter</h1>
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full">
                  Xray Core Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Convert VLESS, Reality & proxy keys into Xray JSON outbounds & merge configs
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
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
              <span>Merge Base JSON</span>
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
              <span>JSON Output</span>
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
