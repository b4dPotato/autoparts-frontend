import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import {heartbeatRequestSchema} from '@/lib/tracking/contracts';
import {SESSION_COOKIE_NAME} from '@/server/tracking/lifecycle';
import {assertTrackingOrigin, parseTrackingBody} from '@/server/tracking/request';
import {trackingErrorResponse} from '@/server/tracking/route-response';
import {recordHeartbeat} from '@/server/tracking/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    assertTrackingOrigin(request);
    const heartbeat = await parseTrackingBody(request, heartbeatRequestSchema);
    const recorded = await recordHeartbeat(
      request.cookies.get(SESSION_COOKIE_NAME)?.value,
      heartbeat
    );

    return recorded
      ? NextResponse.json({ok: true})
      : NextResponse.json({ok: false, error: 'Session expired'}, {status: 409});
  } catch (error) {
    return trackingErrorResponse(error);
  }
}
