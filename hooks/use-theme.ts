"use client";

import { useEffect, useState } from "react";
import type { Theme } from "@/types";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("form-theme");
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const preferred:Theme = media.matches ? "dark" : "light";
      const nextTheme:Theme = saved === "dark" || saved === "light" ? saved : preferred;
      setThemeState(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
    };
    apply();
    if (saved === "system") media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("form-theme", nextTheme);
  };

  return { theme, setTheme, toggleTheme: () => setTheme(theme === "light" ? "dark" : "light") };
}
