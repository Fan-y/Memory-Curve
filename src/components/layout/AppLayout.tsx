import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import ToastContainer from "@/components/Toast";
import { useI18n } from "@/hooks/useI18n";
import { type Locale, localeOptions } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { type ThemeMode, useSettingsStore } from "@/stores/settingsStore";

export default function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const locale = useSettingsStore((state) => state.locale);
  const theme = useSettingsStore((state) => state.theme);
  const setLocale = useSettingsStore((state) => state.setLocale);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const { t } = useI18n();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navItems = [
    { to: "/", label: t("navDashboard"), shortLabel: t("navShortDashboard"), end: true },
    { to: "/guide", label: t("navGuide"), shortLabel: t("navShortGuide") },
    { to: "/add", label: t("navAddEntry"), shortLabel: t("navShortAddEntry") },
    { to: "/history", label: t("navHistory"), shortLabel: t("navShortHistory") },
    { to: "/calendar", label: t("navCalendar"), shortLabel: t("navShortCalendar") },
    { to: "/stats", label: t("navStats"), shortLabel: t("navShortStats") },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight">{t("appName")}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="hidden rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground sm:inline-block sm:text-sm">
                {(() => {
                  const email = user?.email ?? t("anonymousUser");
                  const atIndex = email.indexOf("@");
                  const display = atIndex > 0 ? email.slice(0, atIndex) : email;
                  return display;
                })()}
              </span>
              <span className="inline-flex items-center justify-center rounded-md border bg-background p-1 text-xs text-muted-foreground sm:hidden" aria-label={user?.email ?? "User"}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSettingsOpen((v) => !v)}
                  aria-label={String(t("navSettingsLocale"))}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  </svg>
                </Button>
                <div
                  className={`absolute right-0 top-full z-40 mt-1 w-44 rounded-lg border bg-card p-3 shadow-md ${settingsOpen ? "block" : "hidden"}`}
                >
                  {settingsOpen ? (
                    <>
                      <button
                        className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                        onClick={() => setSettingsOpen(false)}
                      >
                        ×
                      </button>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        {t("navSettingsLocale")}
                      </label>
                      <select
                        className="mb-2 h-8 w-full rounded border border-input bg-background px-1.5 text-xs text-foreground"
                        value={locale}
                        onChange={(event) => {
                          setLocale(event.target.value as Locale);
                          setSettingsOpen(false);
                        }}
                      >
                        {localeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        {t("navSettingsTheme")}
                      </label>
                      <select
                        className="h-8 w-full rounded border border-input bg-background px-1.5 text-xs text-foreground"
                        value={theme}
                        onChange={(event) => {
                          setTheme(event.target.value as ThemeMode);
                          setSettingsOpen(false);
                        }}
                      >
                        <option value="system">{t("themeSystem")}</option>
                        <option value="light">{t("themeLight")}</option>
                        <option value="dark">{t("themeDark")}</option>
                      </select>
                    </>
                  ) : null}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  void signOut();
                }}
              >
                {t("signOut")}
              </Button>
            </div>
          </div>

          <nav className="mt-3 hidden flex-wrap items-center gap-2 sm:flex" aria-label={t("mainNavigation")}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                {...(item.to === "/add" ? { "data-tour": "nav-add-entry" } : {})}
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main key={location.pathname} className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:py-8 sm:pb-8 animate-[pageEnter_0.2s_ease-out]">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden"
        aria-label={t("mobileNavigation")}
      >
        <div
          className={cn(
            "mx-auto grid max-w-md gap-1",
            navItems.length > 5 ? "grid-cols-6" : "grid-cols-5"
          )}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              {...(item.to === "/add" ? { "data-tour": "nav-add-entry" } : {})}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center justify-center rounded-md px-1 font-medium leading-none transition",
                  navItems.length > 5 ? "text-[10px]" : "text-[11px]",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )
              }
            >
              {item.shortLabel}
            </NavLink>
          ))}
        </div>
      </nav>
      <ToastContainer />
    </div>
  );
}
