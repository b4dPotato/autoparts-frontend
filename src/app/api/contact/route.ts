import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import {contactRequestSchema} from '@/lib/contact/contracts';
import {submitLead} from '@/server/leads/service';
import {
  SESSION_COOKIE_NAME,
  VISITOR_COOKIE_NAME
} from '@/server/tracking/lifecycle';
import {
  assertTrackingOrigin,
  parseTrackingBody,
  TrackingRequestError
} from '@/server/tracking/request';
import {recordTrackingEvent} from '@/server/tracking/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    assertTrackingOrigin(request);
    const input = await parseTrackingBody(
      request,
      contactRequestSchema,
      'Invalid contact request'
    );
    const {lead, emailStatus} = await submitLead(
      input,
      {
        sessionId: request.cookies.get(SESSION_COOKIE_NAME)?.value,
        visitorId: request.cookies.get(VISITOR_COOKIE_NAME)?.value
      }
    );
    if (lead.sessionId) {
      try {
        await recordTrackingEvent(lead.sessionId, {
          type: 'form_submit',
          path: input.path,
          targetType: 'form',
          targetId: 'contact-request-form',
          metadata: {contactMethod: input.preferredContact}
        });
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Contact submission tracking failed', error);
        }
      }
    }

    return NextResponse.json(
      {ok: true, leadId: lead.id, emailStatus},
      {status: 201}
    );
  } catch (error) {
    if (error instanceof TrackingRequestError) {
      return NextResponse.json(
        {ok: false, error: error.message},
        {status: error.status}
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error('Contact request failed', error);
    }

    return NextResponse.json(
      {ok: false, error: 'Request could not be submitted'},
      {status: 503}
    );
  }
}
