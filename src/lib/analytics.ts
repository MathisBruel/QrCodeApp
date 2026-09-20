import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  deviceType?: string;
  osName?: string;
  osVersion?: string;
  browserName?: string;
  browserVersion?: string;
}

export function parseUserAgent(userAgent?: string): DeviceInfo {
  if (!userAgent) return {};

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    deviceType: result.device.type || 'desktop',
    osName: result.os.name,
    osVersion: result.os.version,
    browserName: result.browser.name,
    browserVersion: result.browser.version,
  };
}

export function anonymizeIP(ip: string): string {
  if (!ip) return '';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  return ip;
}

export function getClientIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : headers.get('x-real-ip') || 'unknown';
  return anonymizeIP(ip);
}
