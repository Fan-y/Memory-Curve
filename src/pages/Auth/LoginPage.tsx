import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signIn = useAuthStore((state) => state.signIn);
  const signInWithOAuth = useAuthStore((state) => state.signInWithOAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useDocumentTitle("登录 - Memory Curve");

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

    const result = await signIn(email, password);

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.message) {
      setMessage(result.message);
    }

    navigate("/", { replace: true });
  };

  const onOAuthSignIn = async (provider: "google" | "github") => {
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const result = await signInWithOAuth(provider);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.message) {
      setMessage(result.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">欢迎回来</h2>
      <p className="mt-1 text-sm text-muted-foreground">使用邮箱密码登录，或直接使用第三方账号。</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
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
          {submitting ? "提交中..." : "登录"}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            className="w-full"
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => {
              void onOAuthSignIn("google");
            }}
          >
            Google
          </Button>
          <Button
            className="w-full"
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => {
              void onOAuthSignIn("github");
            }}
          >
            GitHub
          </Button>
        </div>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link className="text-primary hover:underline" to="/auth/reset-password">
          忘记密码？
        </Link>
        <Link className="text-primary hover:underline" to="/auth/signup">
          创建账号
        </Link>
      </div>
    </div>
  );
}
