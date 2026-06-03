import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuthStore } from "@/stores/authStore";

export default function HomePage() {
  const user = useAuthStore((state) => state.user);

  useDocumentTitle("首页 - Memory Curve");

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">阶段 2 已完成数据访问层</h2>
        <p className="mt-2 text-muted-foreground">
          当前已具备认证、类型和 API 抽象，下一步可进入复习调度与页面联调。
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-medium">当前会话</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          已登录账号：{user?.email ?? "未登录"}
        </p>
      </div>
    </section>
  );
}
