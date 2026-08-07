import { FormatMode, InboundProtocol, VlessParsedParams, XrayInbound, XrayOutbound, XrayRoutingRule, FullXrayConfig } from '../types';

/**
 * Safely decodes URI components handling UTF-8 special characters (emojis, Cyrillic, etc.)
 */
export function safeDecodeURIComponent(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    try {
      return unescape(str);
    } catch {
      return str;
    }
  }
}

/**
 * Parses a single line (VLESS or other proxy URL) into structured parameter data
 */
export function parseProxyKey(rawLine: string): VlessParsedParams | null {
  const line = rawLine.strip ? rawLine.strip() : rawLine.trim();
  if (!line || line.startsWith('//') || line.startsWith(';')) {
    return null;
  }

  let tag = 'vless-node';
  let urlPart = line;

  if (line.includes('#')) {
    const hashIndex = line.indexOf('#');
    urlPart = line.substring(0, hashIndex);
    const fragment = line.substring(hashIndex + 1);
    tag = safeDecodeURIComponent(fragment).trim();
  }

  try {
    const url = new URL(urlPart);
    const scheme = url.protocol.replace(':', '').toLowerCase();

    const validSchemes = ['vless', 'vmess', 'trojan', 'ss', 'hysteria', 'hysteria2', 'hy2'];
    if (!validSchemes.includes(scheme)) {
      return {
        scheme,
        uuid: '',
        address: '',
        port: 443,
        encryption: 'none',
        flow: '',
        security: 'none',
        network: 'tcp',
        sni: '',
        pbk: '',
        sid: '',
        fp: 'firefox',
        path: '/',
        hostHeader: '',
        mode: 'auto',
        alpn: [],
        tag: tag || 'invalid-key',
        rawKey: line,
        isValid: false,
        error: `Unsupported protocol scheme: ${scheme}`
      };
    }

    const uuid = safeDecodeURIComponent(url.username || '');
    const address = url.hostname || '';
    const port = url.port ? parseInt(url.port, 10) : 443;

    const params = url.searchParams;

    const encryption = params.get('encryption') || 'none';
    const flow = params.get('flow') || '';
    const security = params.get('security') || 'none';
    const network = params.get('type') || params.get('network') || 'tcp';
    const sni = params.get('sni') || params.get('serverName') || address;
    const pbk = params.get('pbk') || params.get('publicKey') || '';
    const sid = params.get('sid') || params.get('shortId') || '';
    const fp = params.get('fp') || params.get('fingerprint') || 'firefox';
    const path = params.get('path') || '/';
    const hostHeader = params.get('host') || params.get('authority') || address;
    const mode = params.get('mode') || 'auto';

    const alpnRaw = params.get('alpn') || '';
    const alpn = alpnRaw
      ? alpnRaw.split(',').map((a) => a.trim()).filter(Boolean)
      : [];

    return {
      scheme,
      uuid,
      address,
      port,
      encryption,
      flow,
      security,
      network,
      sni,
      pbk,
      sid,
      fp,
      path,
      hostHeader,
      mode,
      alpn,
      tag: tag || `${scheme}-${address}`,
      rawKey: line,
      isValid: true
    };
  } catch (err: any) {
    return {
      scheme: 'unknown',
      uuid: '',
      address: '',
      port: 443,
      encryption: 'none',
      flow: '',
      security: 'none',
      network: 'tcp',
      sni: '',
      pbk: '',
      sid: '',
      fp: '',
      path: '/',
      hostHeader: '',
      mode: 'auto',
      alpn: [],
      tag: tag || 'unparseable-node',
      rawKey: line,
      isValid: false,
      error: err?.message || 'Invalid URL structure'
    };
  }
}

/**
 * Converts parsed params into an Xray Outbound object
 */
export function buildOutbound(params: VlessParsedParams, mode: FormatMode = 'flat'): XrayOutbound {
  const {
    scheme,
    uuid,
    address,
    port,
    encryption,
    flow,
    security,
    network,
    sni,
    pbk,
    sid,
    fp,
    path,
    hostHeader,
    mode: xhttpMode,
    alpn,
    tag
  } = params;

  const streamSettings: Record<string, any> = {
    network,
    security
  };

  if (security === 'reality') {
    streamSettings.realitySettings = {
      serverName: sni,
      fingerprint: fp || 'firefox',
      publicKey: pbk,
      shortId: sid
    };
  } else if (security === 'tls') {
    streamSettings.tlsSettings = {
      serverName: sni,
      fingerprint: fp || 'firefox',
      alpn: alpn.length > 0 ? alpn : ['h2', 'http/1.1'],
      echConfigList: '',
      pinnedPeerCertSha256: '',
      verifyPeerCertByName: ''
    };
  }

  if (network === 'ws') {
    streamSettings.wsSettings = {
      path,
      headers: hostHeader ? { Host: hostHeader } : {}
    };
  } else if (network === 'grpc') {
    streamSettings.grpcSettings = {
      serviceName: path || '/',
      multiMode: xhttpMode === 'multi'
    };
  } else if (network === 'xhttp') {
    streamSettings.xhttpSettings = {
      mode: xhttpMode || 'auto',
      path: path || '/',
      host: hostHeader || address,
      scStreamUpServerSecs: '20-80',
      xPaddingBytes: '100-1000'
    };
  }

  if (mode === 'flat') {
    return {
      tag,
      protocol: scheme,
      settings: {
        address,
        encryption: encryption || 'none',
        flow,
        id: uuid,
        port
      },
      streamSettings
    };
  } else {
    return {
      tag,
      protocol: scheme,
      settings: {
        vnext: [
          {
            address,
            port,
            users: [
              {
                id: uuid,
                encryption: encryption || 'none',
                flow
              }
            ]
          }
        ]
      },
      streamSettings
    };
  }
}

/**
 * Builds an Inbound object for multi-port routing
 */
export function buildInbound(
  inboundTag: string,
  port: number,
  protocol: InboundProtocol = 'vless',
  listen: string = '',
  clientUuid?: string
): XrayInbound {
  if (protocol === 'vless') {
    return {
      listen: listen,
      port,
      protocol: 'vless',
      tag: inboundTag,
      settings: {
        clients: [
          {
            id: clientUuid || '52bbd434-80d3-452c-b196-2bfe98287983',
            email: 'admin',
            flow: '',
            limitIp: 0,
            totalGB: 0,
            expiryTime: 0,
            enable: true,
            tgId: 0,
            subId: 'b9l20tr0l5l4aeqr',
            comment: '',
            reset: 0,
            created_at: 1783065559862,
            updated_at: 1786103025000
          }
        ],
        decryption: 'mlkem768x25519plus.native.600s.MODElkUYolaYC7Ih-EvWvvwjMfwnenX5lVp5B0EdjnM',
        encryption: 'mlkem768x25519plus.native.0rtt.5vG41xsznSSjzFJtg-9ZiIWHamMof6XLQVyA8L6lNVI'
      },
      sniffing: {
        enabled: false
      },
      streamSettings: {
        network: 'xhttp',
        xhttpSettings: {
          path: '/',
          host: '',
          mode: 'auto',
          xPaddingBytes: '100-1000',
          xPaddingObfsMode: false,
          xPaddingKey: '',
          xPaddingHeader: '',
          xPaddingPlacement: '',
          xPaddingMethod: '',
          sessionIDPlacement: '',
          sessionIDKey: '',
          sessionIDTable: '',
          sessionIDLength: '',
          seqPlacement: '',
          seqKey: '',
          uplinkDataPlacement: '',
          uplinkDataKey: '',
          scMaxEachPostBytes: '',
          noSSEHeader: false,
          scMaxBufferedPosts: 30,
          scStreamUpServerSecs: '20-80',
          serverMaxHeaderBytes: 0,
          uplinkHTTPMethod: '',
          headers: {},
          scMinPostsIntervalMs: '',
          uplinkChunkSize: 0,
          noGRPCHeader: false,
          enableXmux: false
        },
        security: 'reality',
        realitySettings: {
          show: false,
          xver: 0,
          target: 'www.cloudflare.com:443',
          serverNames: ['www.cloudflare.com'],
          privateKey: 'UNs8Q3C-NnyoPm3M1s9wldrrZJGdIPSNvCNQsC7meHw',
          minClientVer: '',
          maxClientVer: '',
          maxTimediff: 0,
          shortIds: [
            'fc87761b',
            'e7142a',
            '65ea',
            'f1',
            '0b88cc4138',
            '79d9442ee7c61f8f',
            'bae4052430fe',
            'b4f946b3c2eeaa'
          ],
          mldsa65Seed: '',
          settings: {
            publicKey: 'ieBYMMzviSfDvqoZOe2L4eiew4xTUHyFu42wIDfPhC0',
            fingerprint: 'firefox',
            serverName: '',
            spiderX: '/',
            mldsa65Verify: ''
          }
        }
      }
    };
  }

  let settings: Record<string, any> = {};

  if (protocol === 'socks') {
    settings = {
      auth: 'noauth',
      udp: true,
      ip: '127.0.0.1'
    };
  } else if (protocol === 'http') {
    settings = {
      allowTransparent: false,
      userLevel: 0
    };
  } else if (protocol === 'mixed') {
    settings = {
      auth: 'noauth',
      udp: true
    };
  } else if (protocol === 'dokodemo-door') {
    settings = {
      address: '1.1.1.1',
      port: 53,
      network: 'tcp,udp'
    };
  }

  return {
    tag: inboundTag,
    port,
    listen: listen || '0.0.0.0',
    protocol,
    settings,
    sniffing: {
      enabled: true,
      destOverride: ['http', 'tls', 'quic'],
      routeOnly: false
    }
  };
}

/**
 * Returns default direct (freedom) and blocked (blackhole) base outbounds
 */
export function getDefaultBaseOutbounds(): XrayOutbound[] {
  return [
    {
      tag: 'direct',
      protocol: 'freedom',
      settings: {
        domainStrategy: 'AsIs',
        finalRules: [
          {
            action: 'block',
            ip: ['geoip:private']
          },
          {
            action: 'allow'
          }
        ]
      }
    },
    {
      tag: 'blocked',
      protocol: 'blackhole',
      settings: {}
    }
  ];
}
