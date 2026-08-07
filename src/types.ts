export type AppMode = 'outbounds' | 'full_config';
export type FormatMode = 'flat' | 'vnext';
export type InboundProtocol = 'vless' | 'socks' | 'http' | 'dokodemo-door' | 'mixed';

export interface VlessParsedParams {
  scheme: string;
  uuid: string;
  address: string;
  port: number;
  encryption: string;
  flow: string;
  security: string;
  network: string;
  sni: string;
  pbk: string;
  sid: string;
  fp: string;
  path: string;
  hostHeader: string;
  mode: string;
  alpn: string[];
  tag: string;
  rawKey: string;
  isValid: boolean;
  error?: string;
}

export interface XrayOutbound {
  tag: string;
  protocol: string;
  settings: Record<string, any>;
  streamSettings?: Record<string, any>;
  [key: string]: any;
}

export interface XrayInbound {
  tag: string;
  port: number;
  listen: string;
  protocol: string;
  settings: Record<string, any>;
  sniffing?: Record<string, any>;
  [key: string]: any;
}

export interface XrayRoutingRule {
  type: string;
  inboundTag?: string[];
  outboundTag?: string;
  ip?: string[];
  domain?: string[];
  [key: string]: any;
}

export interface FullXrayConfig {
  log?: {
    loglevel: string;
  };
  inbounds: XrayInbound[];
  outbounds: XrayOutbound[];
  routing: {
    domainStrategy: string;
    rules: XrayRoutingRule[];
  };
}

export interface ConversionStats {
  totalLines: number;
  parsedKeys: number;
  invalidKeys: number;
  protocols: Record<string, number>;
  networks: Record<string, number>;
  securityTypes: Record<string, number>;
}
