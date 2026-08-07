import React, { useState } from 'react';
import { Search, Server, Shield, Globe, Cpu, Edit3, Check, Trash2, ChevronDown, ChevronUp, Code2 } from 'lucide-react';
import { XrayOutbound } from '../types';

interface OutboundListProps {
  outbounds: XrayOutbound[];
  onUpdateTag: (index: number, newTag: string) => void;
  onRemoveOutbound: (index: number) => void;
}

export const OutboundList: React.FC<OutboundListProps> = ({
  outbounds,
  onUpdateTag,
  onRemoveOutbound
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempTag, setTempTag] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filtered = outbounds.map((item, idx) => ({ item, originalIndex: idx })).filter(({ item }) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const tagMatch = item.tag?.toLowerCase().includes(q);
    const protocolMatch = item.protocol?.toLowerCase().includes(q);
    const addressMatch = (item.settings?.address || item.settings?.vnext?.[0]?.address || '')
      .toLowerCase()
      .includes(q);
    const securityMatch = item.streamSettings?.security?.toLowerCase().includes(q);
    const networkMatch = item.streamSettings?.network?.toLowerCase().includes(q);
    return tagMatch || protocolMatch || addressMatch || securityMatch || networkMatch;
  });

  const handleStartEdit = (index: number, currentTag: string) => {
    setEditingIndex(index);
    setTempTag(currentTag);
  };

  const handleSaveEdit = (index: number) => {
    if (tempTag.trim()) {
      onUpdateTag(index, tempTag.trim());
    }
    setEditingIndex(null);
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
      
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <span>Converted Outbounds ({outbounds.length})</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Browse, search, edit tags, or inspect parsed node outbounds.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search country, tag, address, or network..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {/* Outbounds List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs bg-slate-900/40 rounded-xl border border-slate-700/40">
          No outbounds match your search filter or no keys have been converted yet.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
          {filtered.map(({ item, originalIndex }) => {
            const isEditing = editingIndex === originalIndex;
            const isExpanded = expandedIndex === originalIndex;

            const address = item.settings?.address || item.settings?.vnext?.[0]?.address || 'N/A';
            const port = item.settings?.port || item.settings?.vnext?.[0]?.port || '';
            const network = item.streamSettings?.network || 'tcp';
            const security = item.streamSettings?.security || 'none';

            return (
              <div
                key={originalIndex}
                className="bg-slate-900/80 border border-slate-700/60 hover:border-slate-600 rounded-xl p-3.5 transition-all text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Left: Tag Name & Edit */}
                  <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                      #{originalIndex + 1}
                    </span>

                    {isEditing ? (
                      <div className="flex items-center space-x-1.5 flex-1 max-w-md">
                        <input
                          type="text"
                          value={tempTag}
                          onChange={(e) => setTempTag(e.target.value)}
                          className="bg-slate-950 border border-indigo-500 rounded-lg px-2 py-1 text-slate-100 text-xs w-full focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(originalIndex)}
                          className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="font-semibold text-slate-100 truncate text-xs sm:text-sm" title={item.tag}>
                          {item.tag}
                        </span>
                        <button
                          onClick={() => handleStartEdit(originalIndex, item.tag)}
                          className="text-slate-500 hover:text-indigo-400 transition-colors p-0.5"
                          title="Edit Tag"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Middle: Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Protocol Badge */}
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-semibold rounded-md text-[10px] uppercase">
                      {item.protocol}
                    </span>

                    {/* Network Badge */}
                    <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 font-mono rounded-md text-[10px] uppercase flex items-center space-x-1">
                      <Cpu className="w-2.5 h-2.5 inline mr-1" />
                      {network}
                    </span>

                    {/* Security Badge */}
                    <span className={`px-2 py-0.5 font-mono rounded-md text-[10px] uppercase border ${
                      security === 'reality'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : security === 'tls'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-700/50 text-slate-400 border-slate-600/50'
                    }`}>
                      {security}
                    </span>

                    {/* Address/Port info */}
                    <span className="text-slate-400 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 truncate max-w-[160px]" title={`${address}:${port}`}>
                      {address}:{port}
                    </span>
                  </div>

                  {/* Right Actions: Expand JSON / Delete */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : originalIndex)}
                      className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center space-x-1 text-[11px]"
                      title="Inspect JSON"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => onRemoveOutbound(originalIndex)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Remove Outbound"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

                {/* Expanded JSON Inspector */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <pre className="bg-slate-950 p-3 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
