import { Navigate, Outlet } from "react-router-dom";

import { useI18n } from "@/hooks/useI18n";
import { useAuthStore } from "@/stores/authStore";

export default function AuthGuard() {
  const { t } = useI18n();
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const configError = useAuthStore((state) => state.configError);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        {t("authInitializingSession")}
      </div>
    );
  }

  if (configError) {
    return <Navigate to="/setup" replace />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
