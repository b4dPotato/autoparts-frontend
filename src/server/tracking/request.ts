import 'server-only';

import type {NextRequest} from 'next/server';
import {ZodError, type ZodType} from 'zod';
import {parseAllowedTrackingOrigins} from '@/lib/tracking/origin';

const MAX_BODY_BYTES = 8 * 1024;

export class TrackingRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export function getAllowedTrackingOrigins(
  nodeEnvironment = process.env.NODE_ENV,
  configuredOrigins = process.env.TRACKING_ALLOWED_ORIGINS
) {
  return parseAllowedTrackingOrigins(nodeEnvironment, configuredOrigins);
}

export function assertTrackingOrigin(request: NextRequest) {
  const fetchSite = request.headers.get('sec-fetch-site');

  if (fetchSite === 'cross-site') {
    throw new TrackingRequestError(403, 'Cross-site request rejected');
  }

  const origin = request.headers.get('origin');
  if (!origin) {
    if (process.env.NODE_ENV === 'production') {
      throw new TrackingRequestError(403, 'Origin required');
    }
    return;
  }

  let normalizedOrigin: string;
  try {
    const parsedOrigin = new URL(origin);
    normalizedOrigin = parsedOrigin.origin;
    if (origin !== normalizedOrigin) {
      throw new Error('Origin header is not canonical');
    }
  } catch {
    throw new TrackingRequestError(403, 'Origin rejected');
  }

  if (!getAllowedTrackingOrigins().has(normalizedOrigin)) {
    throw new TrackingRequestError(403, 'Origin rejected');
  }
}

export async function parseTrackingBody<T>(
  request: NextRequest,
  schema: ZodType<T>,
  invalidPayloadMessage = 'Invalid tracking payload'
): Promise<T> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';

  if (!contentType.startsWith('application/json')) {
    throw new TrackingRequestError(415, 'JSON content type required');
  }

  const declaredLength = Number(request.headers.get('content-length'));

  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new TrackingRequestError(413, 'Payload too large');
  }

  if (!request.body) {
    throw new TrackingRequestError(400, 'Request body required');
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const {done, value} = await reader.read();

    if (done) {
      break;
    }

    totalLength += value.byteLength;

    if (totalLength > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new TrackingRequestError(413, 'Payload too large');
    }

    chunks.push(value);
  }

  const body = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return schema.parse(JSON.parse(new TextDecoder().decode(body)));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) {
      throw new TrackingRequestError(400, invalidPayloadMessage);
    }

    throw error;
  }
}

export function getRequestIp(request: NextRequest) {
  const forwardedFor =
    request.headers.get('x-vercel-forwarded-for') ??
    request.headers.get('x-forwarded-for') ??
    request.headers.get('x-real-ip');

  if (!forwardedFor) {
    return null;
  }

  const value = forwardedFor.split(',')[0]?.trim();
  return value ? value.slice(0, 64) : null;
}

export function getHeaderValue(
  request: NextRequest,
  name: string,
  maximum: number
) {
  const value = request.headers.get(name)?.trim();
  return value ? value.slice(0, maximum) : null;
}
