import {NextResponse} from 'next/server';
import {TrackingRequestError} from './request';

export function trackingErrorResponse(error: unknown) {
  if (error instanceof TrackingRequestError) {
    return NextResponse.json(
      {ok: false, error: error.message},
      {status: error.status}
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('Tracking request failed', error);
  }

  return NextResponse.json(
    {ok: false, error: 'Tracking unavailable'},
    {status: 503}
  );
}
