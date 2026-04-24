"use client";

import { useEffect } from "react";

/**
 * Global keybindings:
 *   Cmd/Ctrl+K → focus the main textarea (#project-description)
 *
 * Mounted once from the Server-Component homepage as a tiny client island
 * so the page itself stays server-rendered.
 */
export function KeyboardShortcuts() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const el = document.getElementById(
          "project-description",
        ) as HTMLTextAreaElement | null;
        if (el) {
          e.preventDefault();
          el.focus();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  return null;
}
