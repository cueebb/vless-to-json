#!/usr/bin/env python3
"""
VLESS & Proxy Key to Xray Outbounds / Full Relay Config JSON Converter
------------------------------------------------------------------------
Usage:
    # Mode 1: Outbounds only
    python convert_vless.py keys.txt -o outbounds.json

    # Mode 2: Full Relay Config (ports 50000+, inbounds + outbounds + 1-to-1 routing)
    python convert_vless.py keys.txt --full -o config.json
"""

import json
import sys
import argparse
from urllib.parse import urlparse, parse_qs, unquote

def parse_vless_url(url_str, format_mode="flat"):
    url_str = url_str.strip()
    if not url_str or url_str.startswith("#"):
        return None, None

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
        return None, None

    scheme = parsed.scheme.lower()
    if scheme not in ["vless", "vmess", "trojan", "ss", "hysteria", "hysteria2", "hy2"]:
        return None, None

    uuid = parsed.username or ""
    address = parsed.hostname or ""
    port = parsed.port or 443

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

    stream_settings = {
        "network": network,
        "security": security
    }

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

    return outbound, uuid


def build_inbound(inbound_tag, port, protocol="vless", listen="", client_uuid=None):
    if protocol == "vless":
        return {
            "listen": listen,
            "port": port,
            "protocol": "vless",
            "tag": inbound_tag,
            "settings": {
                "clients": [
                    {
                        "id": client_uuid or "52bbd434-80d3-452c-b196-2bfe98287983",
                        "email": "admin",
                        "flow": "",
                        "limitIp": 0,
                        "totalGB": 0,
                        "expiryTime": 0,
                        "enable": True,
                        "tgId": 0,
                        "subId": "b9l20tr0l5l4aeqr",
                        "comment": "",
                        "reset": 0,
                        "created_at": 1783065559862,
                        "updated_at": 1786103025000
                    }
                ],
                "decryption": "mlkem768x25519plus.native.600s.MODElkUYolaYC7Ih-EvWvvwjMfwnenX5lVp5B0EdjnM",
                "encryption": "mlkem768x25519plus.native.0rtt.5vG41xsznSSjzFJtg-9ZiIWHamMof6XLQVyA8L6lNVI"
            },
            "sniffing": {
                "enabled": False
            },
            "streamSettings": {
                "network": "xhttp",
                "xhttpSettings": {
                    "path": "/",
                    "host": "",
                    "mode": "auto",
                    "xPaddingBytes": "100-1000",
                    "xPaddingObfsMode": False,
                    "xPaddingKey": "",
                    "xPaddingHeader": "",
                    "xPaddingPlacement": "",
                    "xPaddingMethod": "",
                    "sessionIDPlacement": "",
                    "sessionIDKey": "",
                    "sessionIDTable": "",
                    "sessionIDLength": "",
                    "seqPlacement": "",
                    "seqKey": "",
                    "uplinkDataPlacement": "",
                    "uplinkDataKey": "",
                    "scMaxEachPostBytes": "",
                    "noSSEHeader": False,
                    "scMaxBufferedPosts": 30,
                    "scStreamUpServerSecs": "20-80",
                    "serverMaxHeaderBytes": 0,
                    "uplinkHTTPMethod": "",
                    "headers": {},
                    "scMinPostsIntervalMs": "",
                    "uplinkChunkSize": 0,
                    "noGRPCHeader": False,
                    "enableXmux": False
                },
                "security": "reality",
                "realitySettings": {
                    "show": False,
                    "xver": 0,
                    "target": "www.cloudflare.com:443",
                    "serverNames": [
                        "www.cloudflare.com"
                    ],
                    "privateKey": "UNs8Q3C-NnyoPm3M1s9wldrrZJGdIPSNvCNQsC7meHw",
                    "minClientVer": "",
                    "maxClientVer": "",
                    "maxTimediff": 0,
                    "shortIds": [
                        "fc87761b",
                        "e7142a",
                        "65ea",
                        "f1",
                        "0b88cc4138",
                        "79d9442ee7c61f8f",
                        "bae4052430fe",
                        "b4f946b3c2eeaa"
                    ],
                    "mldsa65Seed": "",
                    "settings": {
                        "publicKey": "ieBYMMzviSfDvqoZOe2L4eiew4xTUHyFu42wIDfPhC0",
                        "fingerprint": "firefox",
                        "serverName": "",
                        "spiderX": "/",
                        "mldsa65Verify": ""
                    }
                }
            }
        }

    settings = {}
    if protocol == "socks":
        settings = {"auth": "noauth", "udp": True, "ip": "127.0.0.1"}
    elif protocol == "http":
        settings = {"allowTransparent": False, "userLevel": 0}
    elif protocol == "mixed":
        settings = {"auth": "noauth", "udp": True}
    elif protocol == "dokodemo-door":
        settings = {"address": "1.1.1.1", "port": 53, "network": "tcp,udp"}

    return {
        "tag": inbound_tag,
        "port": port,
        "listen": listen or "0.0.0.0",
        "protocol": protocol,
        "settings": settings,
        "sniffing": {
            "enabled": True,
            "destOverride": ["http", "tls", "quic"],
            "routeOnly": False
        }
    }


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


def convert_keys_file(input_path, format_mode="flat", full_mode=False, start_port=50000, inbound_protocol="vless", base_json=None):
    with open(input_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    outbounds = []
    inbounds = []
    rules = [
        {
            "type": "field",
            "ip": ["geoip:private"],
            "outboundTag": "blocked"
        }
    ]

    base_outbounds = DEFAULT_BASE_OUTBOUNDS()
    if base_json and isinstance(base_json, dict):
        if "outbounds" in base_json:
            base_outbounds = list(base_json["outbounds"])
        if "inbounds" in base_json:
            inbounds.extend(base_json["inbounds"])
        if "routing" in base_json and "rules" in base_json["routing"]:
            rules = list(base_json["routing"]["rules"])

    existing_tags = set()
    for o in base_outbounds:
        if "tag" in o:
            existing_tags.add(o["tag"])

    current_port = start_port
    converted_count = 0

    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        outbound, client_uuid = parse_vless_url(line, format_mode=format_mode)
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

            if full_mode:
                inbound_tag = f"inbound-{tag}"
                inbound = build_inbound(inbound_tag, current_port, protocol=inbound_protocol, client_uuid=client_uuid)
                inbounds.append(inbound)

                rules.append({
                    "type": "field",
                    "inboundTag": [inbound_tag],
                    "outboundTag": tag
                })
                current_port += 1

            converted_count += 1

    print(f"Successfully converted {converted_count} keys from '{input_path}'!")

    if full_mode:
        return {
            "log": {
                "loglevel": "warning"
            },
            "inbounds": inbounds,
            "outbounds": base_outbounds + outbounds,
            "routing": {
                "domainStrategy": "IPIfNonMatch",
                "rules": rules
            }
        }
    else:
        return base_outbounds + outbounds


def main():
    parser = argparse.ArgumentParser(description="Convert VLESS keys file to Xray Outbounds or Full Relay Config JSON")
    parser.add_argument("input_file", help="Path to input .txt file containing VLESS keys (one per line)")
    parser.add_argument("-o", "--output", default="config.json", help="Path to output .json file")
    parser.add_argument("-m", "--merge", help="Optional path to existing JSON file to merge outbounds/inbounds into")
    parser.add_argument("--format", choices=["flat", "vnext"], default="flat", help="Settings format: 'flat' or 'vnext'")
    parser.add_argument("--full", action="store_true", help="Generate Full Xray Relay Config (Inbounds ports 50000+ & 1-to-1 Routing)")
    parser.add_argument("--start-port", type=int, default=50000, help="Starting port for multi-port inbounds (default: 50000)")
    parser.add_argument("--inbound-protocol", choices=["vless", "socks", "http", "mixed", "dokodemo-door"], default="vless", help="Inbound protocol (default: vless)")

    args = parser.parse_args()

    base_data = None
    if args.merge:
        try:
            with open(args.merge, "r", encoding="utf-8") as bf:
                base_data = json.load(bf)
            print(f"Loaded base JSON from '{args.merge}'")
        except Exception as e:
            print(f"Warning: Could not read merge file '{args.merge}': {e}")

    result = convert_keys_file(
        args.input_file,
        format_mode=args.format,
        full_mode=args.full,
        start_port=args.start_port,
        inbound_protocol=args.inbound_protocol,
        base_json=base_data
    )

    with open(args.output, "w", encoding="utf-8") as of:
        json.dump(result, of, ensure_ascii=False, indent=2)

    print(f"Written merged output to '{args.output}'.")

if __name__ == "__main__":
    main()
