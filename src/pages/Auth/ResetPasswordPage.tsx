import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuthStore } from "@/stores/authStore";

export default function ResetPasswordPage() {
  const resetPassword = useAuthStore((state) => state.resetPassword);

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useDocumentTitle("重置密码 - Memory Curve");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email) {
      setError("请先填写邮箱。");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    const result = await resetPassword(email);

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage(result.message ?? "重置邮件已发送，请到邮箱查看。");
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">重置密码</h2>
      <p className="mt-1 text-sm text-muted-foreground">输入注册邮箱后，我们会发送重置链接。</p>

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

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? "提交中..." : "发送重置邮件"}
        </Button>
      </form>

      <div className="mt-4 text-right text-sm">
        <Link className="text-primary hover:underline" to="/auth/login">
          返回登录
        </Link>
      </div>
    </div>
  );
}
