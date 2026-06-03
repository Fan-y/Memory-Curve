import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AuthGuard from "@/components/AuthGuard";
import AuthLayout from "@/components/AuthLayout";
import AppLayout from "@/components/layout/AppLayout";
import AddEntry from "@/pages/AddEntry";
import CalendarPage from "@/pages/Calendar";
import Dashboard from "@/pages/Dashboard";
import History from "@/pages/History";
import OnboardingPage from "@/pages/Onboarding";
import StatsPage from "@/pages/Stats";
import LoginPage from "@/pages/Auth/LoginPage";
import ResetPasswordPage from "@/pages/Auth/ResetPasswordPage";
import SignUpPage from "@/pages/Auth/SignUpPage";
import NotFoundPage from "@/pages/NotFoundPage";
import SetupRequiredPage from "@/pages/SetupRequiredPage";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const initializeSettings = useSettingsStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
    initializeSettings();
  }, [initialize, initializeSettings]);

  return (
    <Routes>
      <Route path="/setup" element={<SetupRequiredPage />} />

      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="/auth/login" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignUpPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<AuthGuard />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="guide" element={<OnboardingPage />} />
          <Route path="add" element={<AddEntry />} />
          <Route path="history" element={<History />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="stats" element={<StatsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
