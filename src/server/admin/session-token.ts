import {createHmac, randomBytes, timingSafeEqual} from 'node:crypto';

const TOKEN_VERSION = 'v1';
export const ADMIN_SESSION_TTL_SECONDS = 12 * 60 * 60;

function signature(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function createAdminSessionToken(
  secret: string,
  now = new Date(),
  ttlSeconds = ADMIN_SESSION_TTL_SECONDS
) {
  const expiresAt = Math.floor(now.getTime() / 1000) + ttlSeconds;
  const payload = `${TOKEN_VERSION}.${expiresAt}.${randomBytes(18).toString('base64url')}`;
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyAdminSessionToken(
  token: string | undefined,
  secret: string,
  now = new Date()
) {
  if (!token || secret.length < 32) return false;

  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) return false;

  const [version, expires, nonce, suppliedSignature] = parts;
  const expiresAt = Number.parseInt(expires, 10);
  const nowSeconds = Math.floor(now.getTime() / 1000);

  if (
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= nowSeconds ||
    expiresAt > nowSeconds + ADMIN_SESSION_TTL_SECONDS + 60 ||
    !/^[A-Za-z0-9_-]{20,32}$/.test(nonce)
  ) {
    return false;
  }

  const payload = `${version}.${expires}.${nonce}`;
  const expected = Buffer.from(signature(payload, secret));
  const supplied = Buffer.from(suppliedSignature);

  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
