import { Link, Outlet } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";
import { localeOptions } from "@/lib/i18n/messages";
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

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-0 md:h-16">
          <div>
            <h1 className="text-lg font-semibold">{t("appName")}</h1>
            <p className="text-xs text-muted-foreground">{t("stageMvpInProgress")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{t("navSettingsLocale")}</span>
              <select
                className="rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground"
                value={locale}
                onChange={(event) => {
                  setLocale(event.target.value as (typeof localeOptions)[number]["value"]);
                }}
              >
                {localeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{t("navSettingsTheme")}</span>
              <select
                className="rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground"
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

            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <Link to="/">
              <Button variant="outline" size="sm">
                {t("navDashboard")}
              </Button>
            </Link>
            <Link to="/add">
              <Button variant="outline" size="sm">
                {t("navAddEntry")}
              </Button>
            </Link>
            <Link to="/history">
              <Button variant="outline" size="sm">
                {t("navHistory")}
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="outline" size="sm">
                {t("navCalendar")}
              </Button>
            </Link>
            <Link to="/stats">
              <Button variant="outline" size="sm">
                {t("navStats")}
              </Button>
            </Link>
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
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
