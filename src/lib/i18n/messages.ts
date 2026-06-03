export type Locale = "zh-CN" | "en-US";

export const localeOptions: Array<{ value: Locale; label: string }> = [
  { value: "zh-CN", label: "简体中文" },
  { value: "en-US", label: "English" },
];

export const messages = {
  "zh-CN": {
    appName: "Memory Curve",
    navDashboard: "仪表盘",
    navAddEntry: "新增条目",
    navHistory: "历史",
    navCalendar: "日历",
    navStats: "统计",
    navSettingsLocale: "语言",
    navSettingsTheme: "主题",
    signOut: "退出",
    themeLight: "浅色",
    themeDark: "深色",
    themeSystem: "跟随系统",
    stageMvpInProgress: "Stage 6 全功能已落地",
    dashboardTitle: "Dashboard",
    addEntryTitle: "新增条目",
    historyTitle: "History",
    calendarTitle: "Calendar",
    statsTitle: "Stats",
  },
  "en-US": {
    appName: "Memory Curve",
    navDashboard: "Dashboard",
    navAddEntry: "Add Entry",
    navHistory: "History",
    navCalendar: "Calendar",
    navStats: "Stats",
    navSettingsLocale: "Language",
    navSettingsTheme: "Theme",
    signOut: "Sign Out",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    stageMvpInProgress: "Stage 6 completed",
    dashboardTitle: "Dashboard",
    addEntryTitle: "Add Entry",
    historyTitle: "History",
    calendarTitle: "Calendar",
    statsTitle: "Stats",
  },
} as const;

export type MessageKey = keyof typeof messages["zh-CN"];
