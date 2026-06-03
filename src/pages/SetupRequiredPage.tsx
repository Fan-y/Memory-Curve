import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function SetupRequiredPage() {
  useDocumentTitle("配置 Supabase - Memory Curve");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">需要先完成 Supabase 配置</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          当前应用已切换为真实认证流程，请按下面步骤完成阶段 1 外部配置。
        </p>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
          <li>复制项目根目录的 .env.example 为 .env，并填写 URL 与 publishable key。</li>
          <li>在 Supabase 控制台打开 SQL Editor，执行 context/supabase-schema.sql。</li>
          <li>在 Authentication 的 Providers 中启用 Email 登录。</li>
          <li>完成后重启开发服务器并刷新页面。</li>
        </ol>

        <div className="mt-5 rounded-md border border-dashed p-4 text-xs text-muted-foreground">
          提示：前端只能使用 publishable key（或兼容的 anon key），不能使用 secret/service_role key。
        </div>
      </div>
    </div>
  );
}
