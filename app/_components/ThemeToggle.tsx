"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "theme";

function readTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : "system";
}

function applyTheme(theme: Theme) {
  const el = document.documentElement;
  if (theme === "system") {
    el.removeAttribute("data-theme");
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    el.setAttribute("data-theme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  function cycle() {
    const next: Theme =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
    applyTheme(next);
  }

  const label =
    theme === "system" ? "Theme: system" : theme === "light" ? "Theme: light" : "Theme: dark";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={cycle}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted hover:border-[color:var(--fg)] hover:text-fg"
    >
      <span aria-hidden className="text-[14px]">
        {!mounted ? "○" : theme === "system" ? "◐" : theme === "light" ? "☀" : "☾"}
      </span>
    </button>
  );
}
