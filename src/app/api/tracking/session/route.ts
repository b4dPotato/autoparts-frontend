import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import {sessionRequestSchema} from '@/lib/tracking/contracts';
import {
  SESSION_COOKIE_NAME,
  VISITOR_COOKIE_NAME
} from '@/server/tracking/lifecycle';
import {
  assertTrackingOrigin,
  getHeaderValue,
  getRequestIp,
  parseTrackingBody
} from '@/server/tracking/request';
import {trackingErrorResponse} from '@/server/tracking/route-response';
import {resolveTrackingSession} from '@/server/tracking/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    assertTrackingOrigin(request);
    const attribution = await parseTrackingBody(request, sessionRequestSchema);
    const result = await resolveTrackingSession(
      request.cookies.get(VISITOR_COOKIE_NAME)?.value,
      request.cookies.get(SESSION_COOKIE_NAME)?.value,
      attribution,
      {
        ip: getRequestIp(request),
        userAgent: getHeaderValue(request, 'user-agent', 512),
        acceptLanguage: getHeaderValue(request, 'accept-language', 256)
      }
    );
    const response = NextResponse.json({ok: true, created: result.created});
    const secure = process.env.NODE_ENV === 'production';

    response.cookies.set(VISITOR_COOKIE_NAME, result.visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: 60 * 60 * 24 * 400
    });
    response.cookies.set(SESSION_COOKIE_NAME, result.sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    return trackingErrorResponse(error);
  }
}
