import React, { useState } from 'react';
import { Terminal, Copy, Check, Download, Play, FileCode, CheckCircle } from 'lucide-react';

export const PythonScriptModal: React.FC = () => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const pythonScriptCode = `#!/usr/bin/env python3
"""
VLESS & Proxy Key to Xray Outbounds JSON Converter
---------------------------------------------------
Usage:
    python convert_vless.py keys.txt -o outbounds.json
    python convert_vless.py keys.txt --merge base.json -o full_config.json
"""

import json
import sys
import argparse
from urllib.parse import urlparse, parse_qs, unquote

def parse_vless_url(url_str, format_mode="flat"):
    url_str = url_str.strip()
    if not url_str or url_str.startswith("#"):
        return None

    # Handle tag in fragment (#...)
    tag = "vless-node"
    if "#" in url_str:
        url_part, fragment = url_str.split("#", 1)
        tag = unquote(fragment).strip()
    else:
        url_part = url_str

    try:
        parsed = urlparse(url_part)
    except Exception as e:
        print(f"Error parsing URL {url_str}: {e}", file=sys.stderr)
        return None

    scheme = parsed.scheme.lower()
    if scheme not in ["vless", "vmess", "trojan", "ss", "hysteria", "hysteria2", "hy2"]:
        return None

    # Parse user info and address
    uuid = parsed.username or ""
    address = parsed.hostname or ""
    port = parsed.port or 443

    # Parse query parameters
    params = parse_qs(parsed.query)
    
    def get_param(key, default=""):
        val = params.get(key, [default])[0]
        return val

    encryption = get_param("encryption", "none")
    flow = get_param("flow", "")
    security = get_param("security", "none")
    network = get_param("type", get_param("network", "tcp"))
    sni = get_param("sni", get_param("serverName", address))
    pbk = get_param("pbk", get_param("publicKey", ""))
    sid = get_param("sid", get_param("shortId", ""))
    fp = get_param("fp", get_param("fingerprint", "firefox"))
    path = get_param("path", "/")
    host_header = get_param("host", get_param("authority", address))
    mode = get_param("mode", "auto")
    
    alpn_raw = get_param("alpn", "")
    alpn_list = [a.strip() for a in alpn_raw.split(",") if a.strip()] if alpn_raw else []

    # Stream settings
    stream_settings = {
        "network": network,
        "security": security
    }

    if security == "reality":
        stream_settings["realitySettings"] = {
            "serverName": sni,
            "fingerprint": fp,
            "publicKey": pbk,
            "shortId": sid
        }
    elif security == "tls":
        stream_settings["tlsSettings"] = {
            "serverName": sni,
            "fingerprint": fp,
            "alpn": alpn_list,
            "echConfigList": "",
            "pinnedPeerCertSha256": "",
            "verifyPeerCertByName": ""
        }

    if network == "ws":
        stream_settings["wsSettings"] = {
            "path": path,
            "headers": {"Host": host_header} if host_header else {}
        }
    elif network == "grpc":
        stream_settings["grpcSettings"] = {
            "serviceName": get_param("serviceName", path),
            "multiMode": mode == "multi"
        }
    elif network == "xhttp":
        stream_settings["xhttpSettings"] = {
            "mode": mode,
            "path": path,
            "host": host_header,
            "scStreamUpServerSecs": "20-80",
            "xPaddingBytes": "100-1000"
        }

    if format_mode == "flat":
        outbound = {
            "tag": tag,
            "protocol": scheme,
            "settings": {
                "address": address,
                "encryption": encryption,
                "flow": flow,
                "id": uuid,
                "port": port
            },
            "streamSettings": stream_settings
        }
    else:
        outbound = {
            "tag": tag,
            "protocol": scheme,
            "settings": {
                "vnext": [
                    {
                        "address": address,
                        "port": port,
                        "users": [
                            {
                                "id": uuid,
                                "encryption": encryption,
                                "flow": flow
                            }
                        ]
                    }
                ]
            },
            "streamSettings": stream_settings
        }

    return outbound


def DEFAULT_BASE_OUTBOUNDS():
    return [
        {
            "tag": "direct",
            "protocol": "freedom",
            "settings": {
                "domainStrategy": "AsIs",
                "finalRules": [
                    {"action": "block", "ip": ["geoip:private"]},
                    {"action": "allow"}
                ]
            }
        },
        {
            "tag": "blocked",
            "protocol": "blackhole",
            "settings": {}
        }
    ]


def convert_keys_file(input_path, format_mode="flat", base_json=None):
    if base_json is None:
        outbounds = DEFAULT_BASE_OUTBOUNDS()
    elif isinstance(base_json, list):
        outbounds = list(base_json)
    elif isinstance(base_json, dict) and "outbounds" in base_json:
        outbounds = list(base_json["outbounds"])
    else:
        outbounds = DEFAULT_BASE_OUTBOUNDS()

    existing_tags = {o.get("tag") for o in outbounds if "tag" in o}

    with open(input_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    converted_count = 0
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        outbound = parse_vless_url(line, format_mode=format_mode)
        if outbound:
            original_tag = outbound["tag"]
            tag = original_tag
            counter = 1
            while tag in existing_tags:
                tag = f"{original_tag} ({counter})"
                counter += 1
            
            outbound["tag"] = tag
            existing_tags.add(tag)
            outbounds.append(outbound)
            converted_count += 1

    print(f"Successfully converted {converted_count} keys from '{input_path}'!")
    return outbounds


def main():
    parser = argparse.ArgumentParser(description="Convert VLESS keys file to Xray Outbounds JSON")
    parser.add_argument("input_file", help="Path to input .txt file containing VLESS keys (one per line)")
    parser.add_argument("-o", "--output", default="outbounds.json", help="Path to output .json file")
    parser.add_argument("-m", "--merge", help="Optional path to existing JSON file to merge outbounds into")
    parser.add_argument("--format", choices=["flat", "vnext"], default="flat", help="Settings format: 'flat' or 'vnext'")

    args = parser.parse_args()

    base_data = None
    if args.merge:
        try:
            with open(args.merge, "r", encoding="utf-8") as bf:
                base_data = json.load(bf)
            print(f"Loaded base JSON from '{args.merge}'")
        except Exception as e:
            print(f"Warning: Could not read merge file '{args.merge}': {e}")

    result = convert_keys_file(args.input_file, format_mode=args.format, base_json=base_data)

    with open(args.output, "w", encoding="utf-8") as of:
        json.dump(result, of, ensure_ascii=False, indent=2)

    print(f"Written merged output to '{args.output}'. Total outbounds: {len(result)}")

if __name__ == "__main__":
    main()
`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(pythonScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([pythonScriptCode], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'convert_vless.py');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const commandExample = `python convert_vless.py keys.txt -o outbounds.json`;

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(commandExample);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <span>Standalone Python Script (<code className="text-amber-300">convert_vless.py</code>)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Download or copy this pure Python script to run automated conversion directly on your server or terminal.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyScript}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-xl transition-colors border border-slate-600 flex items-center space-x-1.5"
          >
            {copiedScript ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Copy Python Code</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadScript}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-xl transition-colors shadow-sm flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download convert_vless.py</span>
          </button>
        </div>
      </div>

      {/* CLI Usage Guide */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700/60 space-y-3">
        <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider block">Terminal Usage Instructions</span>
        
        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-amber-200">
          <code>{commandExample}</code>
          <button
            onClick={handleCopyCommand}
            className="p-1 text-slate-400 hover:text-white"
            title="Copy Command"
          >
            {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="text-xs text-slate-400 space-y-1 pl-1">
          <p>• <strong className="text-slate-200">Convert keys file:</strong> <code className="text-indigo-300">python convert_vless.py my_keys.txt -o outbounds.json</code></p>
          <p>• <strong className="text-slate-200">Merge into existing config:</strong> <code className="text-indigo-300">python convert_vless.py my_keys.txt --merge base.json -o full.json</code></p>
          <p>• <strong className="text-slate-200">Format choice:</strong> <code className="text-indigo-300">--format flat</code> or <code className="text-indigo-300">--format vnext</code></p>
        </div>
      </div>

      {/* Python Code Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium flex items-center space-x-1.5 text-slate-300">
            <FileCode className="w-4 h-4 text-amber-400" />
            <span>Python Source Code (Standard Library Only - No Pip Dependencies)</span>
          </span>
        </div>

        <textarea
          readOnly
          value={pythonScriptCode}
          rows={16}
          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-4 text-amber-200 font-mono text-xs leading-relaxed focus:outline-none custom-scrollbar"
        />
      </div>

    </div>
  );
};
