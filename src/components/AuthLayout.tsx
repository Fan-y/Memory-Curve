import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "@/stores/authStore";

export default function AuthLayout() {
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const configError = useAuthStore((state) => state.configError);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        正在初始化会话...
      </div>
    );
  }

  if (configError) {
    return <Navigate to="/setup" replace />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Memory Curve</h1>
          <p className="mt-1 text-sm text-muted-foreground">专注长期记忆与复习节奏</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
