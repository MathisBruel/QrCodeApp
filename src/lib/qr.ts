import QRCode from 'qrcode';
import { nanoid } from 'nanoid';

export async function generateQRCodeDataURL(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

export function generateShortCode(): string {
  return nanoid(8).toLowerCase();
}

const RESERVED_SLUGS = new Set(['generate', 'stats']);
const SLUG_PATTERN = /^[a-zA-Z0-9-_]{3,50}$/;

export function validateSlug(slug: string): string | null {
  if (!SLUG_PATTERN.test(slug)) {
    return 'Link must be 3-50 characters (letters, numbers, - and _ only)';
  }
  if (RESERVED_SLUGS.has(slug.toLowerCase())) {
    return 'This link is reserved, choose another';
  }
  return null;
}

export function getTrackingPixel(qrCodeId: string): string {
  return `${process.env.APP_URL}/api/qr/${qrCodeId}/pixel.gif`;
}
