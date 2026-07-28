"use client";

import { useCallback, useSyncExternalStore } from "react";

const MOBILE_HINT_KEY = "mobileHintSeen";
const MOBILE_HINT_EVENT = "jiddu:mobile-hint-change";
const MOBILE_QUERY = "(max-width: 1023px)";

function readMobileHint(): boolean {
  try {
    return (
      window.matchMedia(MOBILE_QUERY).matches &&
      localStorage.getItem(MOBILE_HINT_KEY) !== "1"
    );
  } catch {
    return false;
  }
}

function subscribeMobileHint(notify: () => void): () => void {
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener("change", notify);
  window.addEventListener(MOBILE_HINT_EVENT, notify);
  return () => {
    media.removeEventListener("change", notify);
    window.removeEventListener(MOBILE_HINT_EVENT, notify);
  };
}

export function useMobileHint(): {
  showHint: boolean;
  dismissHint: () => void;
} {
  const showHint = useSyncExternalStore(
    subscribeMobileHint,
    readMobileHint,
    () => false,
  );

  const dismissHint = useCallback(() => {
    try {
      localStorage.setItem(MOBILE_HINT_KEY, "1");
    } catch {}
    window.dispatchEvent(new Event(MOBILE_HINT_EVENT));
  }, []);

  return { showHint, dismissHint };
}
