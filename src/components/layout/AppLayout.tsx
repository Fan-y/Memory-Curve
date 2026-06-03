import { NavLink, Outlet } from "react-router-dom";

import { Button } from "@/components/ui/button";
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
              <p className="text-sm text-muted-foreground">{t("stageMvpInProgress")}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="max-w-[220px] truncate rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground sm:text-sm">
                {user?.email ?? t("anonymousUser")}
              </span>

              <label className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                <span>{t("navSettingsLocale")}</span>
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                  value={locale}
                  onChange={(event) => {
                    setLocale(event.target.value as Locale);
                  }}
                >
                  {localeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                <span>{t("navSettingsTheme")}</span>
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                  value={theme}
                  onChange={(event) => {
                    setTheme(event.target.value as ThemeMode);
                  }}
                >
                  <option value="system">{t("themeSystem")}</option>
                  <option value="light">{t("themeLight")}</option>
                  <option value="dark">{t("themeDark")}</option>
                </select>
              </label>

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

      <main className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:py-8 sm:pb-8">
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
    </div>
  );
}
