"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal behaviour for an overlay panel: Escape closes, Tab stays inside, the page behind does not
 * scroll, focus moves in on open and returns to the opener on close. The same contract as the
 * job-alert modal and the BSO Intelligence menu (docs/ui-alignment-from-intelligence.md §3.1, §3.5).
 */
export function useModalDialog(open: boolean, onClose: () => void, panelRef: RefObject<HTMLElement | null>, initialFocusRef?: RefObject<HTMLElement | null>) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // After any `inert` attribute lifts on this render.
    const focusTimer = window.setTimeout(() => {
      (initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    }, 30);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = priorOverflow;
      opener?.focus({ preventScroll: true });
    };
  }, [open, panelRef, initialFocusRef]);
}
