import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuthStore } from "@/stores/authStore";

export default function SignUpPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signUp = useAuthStore((state) => state.signUp);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useDocumentTitle("注册 - Memory Curve");

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setError("请先填写邮箱和密码。");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    const result = await signUp(email, password, displayName.trim() || undefined);

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.message) {
      setMessage(result.message);
    }

    if (!result.message?.includes("邮箱")) {
      navigate("/", { replace: true });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">创建账号</h2>
      <p className="mt-1 text-sm text-muted-foreground">注册后即可开始使用你的记忆曲线。</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium">显示名（可选）</label>
          <Input
            type="text"
            placeholder="例如：Alex"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">邮箱</label>
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">密码</label>
          <Input
            type="password"
            placeholder="至少 6 位"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? "提交中..." : "注册"}
        </Button>
      </form>

      <div className="mt-4 text-right text-sm">
        <Link className="text-primary hover:underline" to="/auth/login">
          已有账号？去登录
        </Link>
      </div>
    </div>
  );
}
