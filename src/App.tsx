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
import { AppMode, FormatMode, InboundProtocol, XrayOutbound, XrayInbound, XrayRoutingRule, ConversionStats } from './types';
import { parseProxyKey, buildOutbound, buildInbound, getDefaultBaseOutbounds } from './utils/vlessParser';
import { get100SampleKeys } from './data/sampleKeys';
import { FileCode, ArrowRight, ShieldCheck, Sparkles, Terminal, Network } from 'lucide-react';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('outbounds');
  const [activeTab, setActiveTab] = useState<'convert' | 'merge' | 'json' | 'python'>('convert');
  const [rawKeysText, setRawKeysText] = useState<string>('');
  const [formatMode, setFormatMode] = useState<FormatMode>('flat');
  const [startPort, setStartPort] = useState<number>(50000);
  const [inboundProtocol, setInboundProtocol] = useState<InboundProtocol>('vless');
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
    if (!includeBaseRules || !baseJsonText.trim()) return getDefaultBaseOutbounds();
    try {
      const parsed = JSON.parse(baseJsonText);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object' && Array.isArray(parsed.outbounds)) return parsed.outbounds;
      return getDefaultBaseOutbounds();
    } catch {
      return getDefaultBaseOutbounds();
    }
  }, [includeBaseRules, baseJsonText]);

  // Combined final merged outbounds array
  const finalOutbounds = useMemo<XrayOutbound[]>(() => {
    const existingTags = new Set<string>();
    const result: XrayOutbound[] = [];

    // Add base outbounds if enabled
    if (includeBaseRules) {
      baseOutbounds.forEach((b) => {
        if (b && typeof b === 'object' && b.tag) {
          existingTags.add(b.tag);
          result.push(b);
        }
      });
    }

    // Add converted key outbounds
    parsedItems.validParams.forEach(({ param }, keyIdx) => {
      if (removedIndices.has(keyIdx)) return;

      const outbound = buildOutbound(param, formatMode);

      if (editedTags[keyIdx]) {
        outbound.tag = editedTags[keyIdx];
      } else {
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
  }, [baseOutbounds, includeBaseRules, parsedItems, formatMode, editedTags, removedIndices]);

  // Full Xray Config Object (Inbounds + Outbounds + 1-to-1 Routing Rules)
  const fullConfigObject = useMemo(() => {
    const inbounds: XrayInbound[] = [];
    const routingRules: XrayRoutingRule[] = [
      {
        type: 'field',
        ip: ['geoip:private'],
        outboundTag: 'blocked'
      }
    ];

    let currentPort = startPort;

    parsedItems.validParams.forEach(({ param }, keyIdx) => {
      if (removedIndices.has(keyIdx)) return;

      const tag = editedTags[keyIdx] || param.tag || 'vless-node';
      const inboundTag = `inbound-${tag}`;

      inbounds.push(buildInbound(inboundTag, currentPort, inboundProtocol, '', param.uuid));

      routingRules.push({
        type: 'field',
        inboundTag: [inboundTag],
        outboundTag: tag
      });

      currentPort++;
    });

    return {
      log: {
        loglevel: 'warning'
      },
      inbounds,
      outbounds: finalOutbounds,
      routing: {
        domainStrategy: 'IPIfNonMatch',
        rules: routingRules
      }
    };
  }, [parsedItems, removedIndices, editedTags, startPort, inboundProtocol, finalOutbounds]);

  const handleUpdateTag = (index: number, newTag: string) => {
    const baseCount = includeBaseRules ? baseOutbounds.length : 0;
    if (index >= baseCount) {
      const keyIdx = index - baseCount;
      setEditedTags((prev) => ({ ...prev, [keyIdx]: newTag }));
    }
  };

  const handleRemoveOutbound = (index: number) => {
    const baseCount = includeBaseRules ? baseOutbounds.length : 0;
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
        appMode={appMode}
        setAppMode={setAppMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        parsedCount={parsedItems.validParams.length}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Quick Mode Indicator & Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${appMode === 'full_config' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
              {appMode === 'full_config' ? <Network className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Active Converter Mode</span>
              <span className={`text-sm font-bold ${appMode === 'full_config' ? 'text-emerald-300' : 'text-indigo-300'}`}>
                {appMode === 'full_config' ? 'Full Multi-Port Relay (Ports 50000+)' : 'Outbounds Array Only'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Converted Node Stats</span>
              <span className="text-sm font-bold text-slate-100">
                {parsedItems.validParams.length - removedIndices.size} Active Nodes
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">CLI Executable</span>
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
              appMode={appMode}
              rawKeysText={rawKeysText}
              setRawKeysText={setRawKeysText}
              formatMode={formatMode}
              setFormatMode={setFormatMode}
              startPort={startPort}
              setStartPort={setStartPort}
              inboundProtocol={inboundProtocol}
              setInboundProtocol={setInboundProtocol}
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
          <JsonViewer
            appMode={appMode}
            outbounds={finalOutbounds}
            fullConfig={fullConfigObject}
          />
        )}

        {/* Tab 4: Python Script & CLI Guide */}
        {activeTab === 'python' && (
          <PythonScriptModal />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>VLESS & Proxy Key Converter for Xray Core • Outbounds & Multi-Port Relay Config Builder</p>
        </div>
      </footer>

    </div>
  );
}
