import { FormatMode, VlessParsedParams, XrayOutbound } from '../types';

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
    // Standard URL parser needs a scheme
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

  // Stream settings building
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

  // Network specific settings
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
    // Matching exact user requested flat settings structure
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
    // Standard Xray vnext format
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
