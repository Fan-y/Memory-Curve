import { create } from "zustand";

import type { Locale } from "@/lib/i18n/messages";

export type ThemeMode = "light" | "dark" | "system";

type SettingsState = {
  initialized: boolean;
  locale: Locale;
  theme: ThemeMode;
  initialize: () => void;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemeMode) => void;
};

const STORAGE_KEY_LOCALE = "memory-curve-locale";
const STORAGE_KEY_THEME = "memory-curve-theme";

let systemThemeCleanup: (() => void) | null = null;

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  const effectiveTheme = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", effectiveTheme === "dark");
}

function bindSystemTheme(theme: ThemeMode) {
  systemThemeCleanup?.();
  systemThemeCleanup = null;

  if (typeof window === "undefined" || theme !== "system") {
    return;
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => applyTheme("system");

  mediaQuery.addEventListener("change", onChange);
  systemThemeCleanup = () => {
    mediaQuery.removeEventListener("change", onChange);
  };
}

function readLocaleFromStorage(): Locale {
  if (typeof window === "undefined") {
    return "zh-CN";
  }

  const value = window.localStorage.getItem(STORAGE_KEY_LOCALE);
  return value === "en-US" ? "en-US" : "zh-CN";
}

function readThemeFromStorage(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const value = window.localStorage.getItem(STORAGE_KEY_THEME);
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "system";
}

export const useSettingsStore = create<SettingsState>((set) => ({
  initialized: false,
  locale: "zh-CN",
  theme: "system",

  initialize: () => {
    const locale = readLocaleFromStorage();
    const theme = readThemeFromStorage();

    applyTheme(theme);
    bindSystemTheme(theme);

    set({
      initialized: true,
      locale,
      theme,
    });
  },

  setLocale: (locale) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY_LOCALE, locale);
    }

    set({ locale });
  },

  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY_THEME, theme);
    }

    applyTheme(theme);
    bindSystemTheme(theme);
    set({ theme });
  },
}));
