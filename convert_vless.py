#!/usr/bin/env python3
"""
VLESS & Proxy Key to Xray Outbounds JSON Converter
---------------------------------------------------
Usage:
    python convert_vless.py keys.txt -o outbounds.json
    python convert_vless.py keys.txt --merge base_config.json -o full_config.json
"""

import json
import sys
import argparse
from urllib.parse import urlparse, parse_qs, unquote

def parse_vless_url(url_str, format_mode="flat"):
    """
    Parses a vless:// URL and converts it into an Xray outbound JSON object.
    
    Supported parameters:
    - uuid/id: User UUID
    - host/address: Server domain or IP
    - port: Server port
    - encryption: default 'none'
    - flow: e.g., 'xtls-rprx-vision'
    - security: 'reality', 'tls', 'none'
    - sni/serverName: SNI for TLS/REALITY
    - pbk/publicKey: Public key for REALITY
    - sid/shortId: Short ID for REALITY
    - fp/fingerprint: Client fingerprint
    - type/network: 'tcp', 'ws', 'grpc', 'xhttp', 'kcp'
    - path: Path for WS/xhttp
    - host/authority: Host header for HTTP/WS/xhttp
    - alpn: ALPN list or string
    - tag (#fragment): Outbound tag name
    """
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

    # TLS / Reality configuration
    if security == "reality":
        stream_settings["realitySettings"] = {
            "serverName": sni,
            "fingerprint": fp,
            "publicKey": pbk,
            "shortId": sid,
            "spiderX": get_param("spx", "")
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

    # Network settings
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
            "xPaddingBytes": get_param("xPaddingBytes", "100-1000")
        }

    # Construct Outbound object according to mode
    if format_mode == "flat":
        # Flat settings structure (matching user example)
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
        # Standard Xray vnext structure
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
    """
    Reads a file with keys (one per line) and merges parsed outbounds with base JSON.
    """
    if base_json is None:
        outbounds = DEFAULT_BASE_OUTBOUNDS()
    elif isinstance(base_json, list):
        outbounds = list(base_json)
    elif isinstance(base_json, dict) and "outbounds" in base_json:
        outbounds = list(base_json["outbounds"])
    else:
        outbounds = DEFAULT_BASE_OUTBOUNDS()

    # Track tags to prevent duplicates
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
            # Handle unique tags if needed
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
    parser.add_argument("-o", "--output", default="outbounds.json", help="Path to output .json file (default: outbounds.json)")
    parser.add_argument("-m", "--merge", help="Optional path to existing JSON file to merge outbounds into")
    parser.add_argument("--format", choices=["flat", "vnext"], default="flat", help="Settings format: 'flat' (user style) or 'vnext' (standard Xray)")

    args = parser.parse_args()

    base_data = None
    if args.merge:
        try:
            with open(args.merge, "r", encoding="utf-8") as bf:
                base_data = json.load(bf)
            print(f"Loaded base JSON from '{args.merge}'")
        except Exception as e:
            print(f"Warning: Could not read merge file '{args.merge}': {e}. Using default base outbounds.")

    result = convert_keys_file(args.input_file, format_mode=args.format, base_json=base_data)

    with open(args.output, "w", encoding="utf-8") as of:
        json.dump(result, of, ensure_ascii=False, indent=2)

    print(f"Written merged output to '{args.output}'. Total outbounds: {len(result)}")

if __name__ == "__main__":
    main()
