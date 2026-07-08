'use client';

import {
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode
} from 'react';

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
  function reportConversion(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented || !window.gtag_report_conversion) {
      return;
    }

    event.preventDefault();
    window.gtag_report_conversion(href);
  }

  return (
    <a href={href} onClick={reportConversion} {...props}>
      {children}
    </a>
  );
}
