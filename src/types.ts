export type FormatMode = 'flat' | 'vnext';

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

export interface ConversionStats {
  totalLines: number;
  parsedKeys: number;
  invalidKeys: number;
  protocols: Record<string, number>;
  networks: Record<string, number>;
  securityTypes: Record<string, number>;
}
