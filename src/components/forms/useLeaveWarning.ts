"use client";

import { useEffect } from "react";

const MESSAGE = "You have unsaved changes. Leave this page and lose them?";

/**
 * Warns before unsaved changes are lost. Closing the tab, reloading or going
 * to another site gets the browser's own "Leave site?" dialog, whose text
 * can't be changed. Links inside the admin are client-side navigations the
 * browser doesn't warn about, so their clicks are checked here first (capture
 * phase, before React) and cancelled if the admin chooses to stay; Next's
 * Link and PendingLink skip a cancelled click. The browser's Back button
 * isn't covered.
 */
export function useLeaveWarning(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers need returnValue set to show the dialog.
      event.returnValue = "";
    };
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.target === "_blank" ||
        link.hasAttribute("download")
      )
        return;
      const url = new URL(link.href);
      // Other sites unload the page, so beforeunload covers them.
      if (url.origin !== location.origin) return;
      // Jump links within the same page lose nothing.
      if (url.pathname === location.pathname && url.search === location.search)
        return;
      if (!window.confirm(MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
    };
  }, [active]);
}
