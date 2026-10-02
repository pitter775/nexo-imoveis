import { createHmac, timingSafeEqual } from 'node:crypto';

export function validateWebhookSignature(headers: Headers, resourceId: string, secret: string | undefined) {
  if (!secret?.trim()) return false;
  const signature = headers.get('x-signature');
  const requestId = headers.get('x-request-id');
  if (!signature || !requestId) return false;
  const parts = new Map(signature.split(',').map(part => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }));
  const timestamp = parts.get('ts');
  const digest = parts.get('v1');
  if (!timestamp || !/^\d+$/.test(timestamp) || !digest || !/^[a-f0-9]{64}$/i.test(digest)) return false;
  const manifest = `id:${resourceId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const expected = createHmac('sha256', secret.trim()).update(manifest).digest();
  return timingSafeEqual(expected, Buffer.from(digest, 'hex'));
}
