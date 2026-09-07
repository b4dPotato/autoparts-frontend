"use client";

import type {
  AnchorHTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";
import { trackElementEvent } from "@/lib/tracking/client";

type SmoothScrollLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

export function SmoothScrollLink({
  href,
  children,
  onClick,
  ...props
}: SmoothScrollLinkProps) {
  function scrollToTarget(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !href.startsWith("#")
    ) {
      return;
    }

    const target = document.getElementById(href.slice(1));

    if (!target) {
      return;
    }

    trackElementEvent("navigation_click", event.currentTarget);

    event.preventDefault();

    const scrollMarginTop = Number.parseFloat(
      window.getComputedStyle(target).scrollMarginTop,
    );
    const targetTop =
      window.scrollY +
      target.getBoundingClientRect().top -
      (Number.isFinite(scrollMarginTop) ? scrollMarginTop : 0);

    window.history.pushState(null, "", href);
    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }

  return (
    <a href={href} onClick={scrollToTarget} {...props}>
      {children}
    </a>
  );
}
