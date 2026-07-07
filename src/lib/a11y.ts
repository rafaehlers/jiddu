import type { KeyboardEvent } from "react";

/**
 * Keyboard activation for non-<button> elements that carry a click handler
 * (e.g. the in-text <mark> highlights that open the matching comment).
 * Mirrors the native button behaviour: Enter and Space fire the handler,
 * and Space's default page-scroll is suppressed. Pair with
 * `role="button"` + `tabIndex={0}` so the element is focusable and
 * announced correctly.
 */
export function onActivate(handler: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      handler();
    }
  };
}
