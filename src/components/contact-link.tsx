'use client';

import {
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode
} from 'react';
import {trackElementEvent} from '@/lib/tracking/client';
import type {TrackingEventType} from '@/lib/tracking/contracts';

declare global {
  interface Window {
    gtag_report_conversion?: (url?: string) => boolean;
  }
}

type ContactLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

export function ContactLink({
  href,
  children,
  onClick,
  ...props
}: ContactLinkProps) {
  function getEventType(): TrackingEventType {
    if (href.startsWith('tel:')) return 'phone_click';
    if (href.startsWith('viber:')) return 'viber_click';
    if (href.includes('t.me/')) return 'telegram_click';
    if (href.includes('wa.me/')) return 'whatsapp_click';
    return 'outbound_click';
  }

  function reportConversion(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    trackElementEvent(getEventType(), event.currentTarget);

    if (!window.gtag_report_conversion) return;

    event.preventDefault();
    window.gtag_report_conversion(href);
  }

  return (
    <a href={href} onClick={reportConversion} {...props}>
      {children}
    </a>
  );
}
