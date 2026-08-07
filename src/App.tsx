/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { KeyInputSection } from './components/KeyInputSection';
import { MergeConfigSection } from './components/MergeConfigSection';
import { OutboundList } from './components/OutboundList';
import { JsonViewer } from './components/JsonViewer';
import { PythonScriptModal } from './components/PythonScriptModal';
import { FormatMode, XrayOutbound, ConversionStats } from './types';
import { parseProxyKey, buildOutbound, getDefaultBaseOutbounds } from './utils/vlessParser';
import { get100SampleKeys } from './data/sampleKeys';
import { FileCode, ArrowRight, ShieldCheck, Sparkles, Terminal } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'convert' | 'merge' | 'json' | 'python'>('convert');
  const [rawKeysText, setRawKeysText] = useState<string>('');
  const [formatMode, setFormatMode] = useState<FormatMode>('flat');
  const [includeBaseRules, setIncludeBaseRules] = useState<boolean>(true);
  const [baseJsonText, setBaseJsonText] = useState<string>('');
  const [editedTags, setEditedTags] = useState<Record<number, string>>({});
  const [removedIndices, setRemovedIndices] = useState<Set<number>>(new Set());

  // Parse raw keys lines
  const parsedItems = useMemo(() => {
    const lines = rawKeysText.split('\n');
    const validParams: { param: any; lineIndex: number }[] = [];
    let totalLinesCount = 0;
    let invalidCount = 0;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) return;
      totalLinesCount++;

      const parsed = parseProxyKey(trimmed);
      if (parsed && parsed.isValid) {
        validParams.push({ param: parsed, lineIndex: idx });
      } else {
        invalidCount++;
      }
    });

    return { validParams, totalLinesCount, invalidCount };
  }, [rawKeysText]);

  // Statistics calculation
  const stats: ConversionStats = useMemo(() => {
    const protocols: Record<string, number> = {};
    const networks: Record<string, number> = {};
    const securityTypes: Record<string, number> = {};

    parsedItems.validParams.forEach(({ param }) => {
      protocols[param.scheme] = (protocols[param.scheme] || 0) + 1;
      networks[param.network] = (networks[param.network] || 0) + 1;
      securityTypes[param.security] = (securityTypes[param.security] || 0) + 1;
    });

    return {
      totalLines: parsedItems.totalLinesCount,
      parsedKeys: parsedItems.validParams.length,
      invalidKeys: parsedItems.invalidCount,
      protocols,
      networks,
      securityTypes
    };
  }, [parsedItems]);

  // Base outbounds parsing
  const baseOutbounds = useMemo<XrayOutbound[]>(() => {
    if (!includeBaseRules || !baseJsonText.trim()) return [];
    try {
      const parsed = JSON.parse(baseJsonText);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object' && Array.isArray(parsed.outbounds)) return parsed.outbounds;
      return [];
    } catch {
      return [];
    }
  }, [includeBaseRules, baseJsonText]);

  // Combined final merged outbounds array
  const finalOutbounds = useMemo<XrayOutbound[]>(() => {
    const existingTags = new Set<string>();
    const result: XrayOutbound[] = [];

    // Add base outbounds
    baseOutbounds.forEach((b) => {
      if (b && typeof b === 'object' && b.tag) {
        existingTags.add(b.tag);
        result.push(b);
      }
    });

    // Add converted key outbounds
    parsedItems.validParams.forEach(({ param }, keyIdx) => {
      if (removedIndices.has(keyIdx)) return;

      const outbound = buildOutbound(param, formatMode);

      // Apply custom edited tag if present
      if (editedTags[keyIdx]) {
        outbound.tag = editedTags[keyIdx];
      } else {
        // Ensure unique tags
        let originalTag = outbound.tag || 'vless-node';
        let tag = originalTag;
        let counter = 1;
        while (existingTags.has(tag)) {
          tag = `${originalTag} (${counter})`;
          counter++;
        }
        outbound.tag = tag;
      }

      existingTags.add(outbound.tag);
      result.push(outbound);
    });

    return result;
  }, [baseOutbounds, parsedItems, formatMode, editedTags, removedIndices]);

  const handleUpdateTag = (index: number, newTag: string) => {
    // Determine if index corresponds to base or key outbounds
    const baseCount = baseOutbounds.length;
    if (index >= baseCount) {
      const keyIdx = index - baseCount;
      setEditedTags((prev) => ({ ...prev, [keyIdx]: newTag }));
    }
  };

  const handleRemoveOutbound = (index: number) => {
    const baseCount = baseOutbounds.length;
    if (index >= baseCount) {
      const keyIdx = index - baseCount;
      setRemovedIndices((prev) => {
        const next = new Set(prev);
        next.add(keyIdx);
        return next;
      });
    }
  };

  const handleLoadSampleKeys = () => {
    setRawKeysText(get100SampleKeys().join('\n'));
    setRemovedIndices(new Set());
    setEditedTags({});
  };

  const handleClearKeys = () => {
    setRawKeysText('');
    setRemovedIndices(new Set());
    setEditedTags({});
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        parsedCount={parsedItems.validParams.length}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Quick Tab Switcher Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Input Keys Loaded</span>
              <span className="text-sm font-bold text-slate-100">
                {parsedItems.validParams.length} Valid Keys Convert Ready
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Output JSON Outbounds</span>
              <span className="text-sm font-bold text-emerald-300">
                {finalOutbounds.length} Total Outbounds (Merged)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Python CLI Script</span>
              <span className="text-sm font-bold text-amber-300">
                <code className="text-xs font-mono">convert_vless.py</code>
              </span>
            </div>
          </div>
        </div>

        {/* Tab 1: Key Input & Converter */}
        {activeTab === 'convert' && (
          <div className="space-y-8">
            <KeyInputSection
              rawKeysText={rawKeysText}
              setRawKeysText={setRawKeysText}
              formatMode={formatMode}
              setFormatMode={setFormatMode}
              stats={stats}
              onLoadSampleKeys={handleLoadSampleKeys}
              onClear={handleClearKeys}
            />

            {/* Converted Outbounds Cards / Table */}
            <OutboundList
              outbounds={finalOutbounds}
              onUpdateTag={handleUpdateTag}
              onRemoveOutbound={handleRemoveOutbound}
            />
          </div>
        )}

        {/* Tab 2: Base JSON & Merge Settings */}
        {activeTab === 'merge' && (
          <div className="space-y-8">
            <MergeConfigSection
              baseJsonText={baseJsonText}
              setBaseJsonText={setBaseJsonText}
              includeBaseRules={includeBaseRules}
              setIncludeBaseRules={setIncludeBaseRules}
              parsedKeysCount={parsedItems.validParams.length}
            />

            <OutboundList
              outbounds={finalOutbounds}
              onUpdateTag={handleUpdateTag}
              onRemoveOutbound={handleRemoveOutbound}
            />
          </div>
        )}

        {/* Tab 3: JSON Output & Export */}
        {activeTab === 'json' && (
          <JsonViewer outbounds={finalOutbounds} />
        )}

        {/* Tab 4: Python Script & CLI Guide */}
        {activeTab === 'python' && (
          <PythonScriptModal />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>VLESS & Proxy Key Converter for Xray Core • Generates valid Xray Outbounds JSON & Python CLI Utilities</p>
        </div>
      </footer>

    </div>
  );
}
