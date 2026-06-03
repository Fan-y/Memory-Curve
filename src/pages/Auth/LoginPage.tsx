import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useI18n } from "@/hooks/useI18n";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signIn = useAuthStore((state) => state.signIn);
  const signInWithOAuth = useAuthStore((state) => state.signInWithOAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useDocumentTitle(`${t("loginTitle")} - Memory Curve`);

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setError(t("loginValidationMissingCredentials"));
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

    if (result.code === "AUTH_OAUTH_REDIRECTING") {
      setMessage(t("loginOAuthRedirecting"));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">{t("loginHeading")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("loginSubtitle")}</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("authEmailLabel")}</label>
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("authPasswordLabel")}</label>
          <Input
            type="password"
            placeholder={t("authPasswordPlaceholder")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? t("authSubmitting") : t("loginSubmit")}
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link className="text-primary hover:underline" to="/auth/reset-password">
          {t("loginForgotPassword")}
        </Link>
        <Link className="text-primary hover:underline" to="/auth/signup">
          {t("loginCreateAccount")}
        </Link>
      </div>
    </div>
  );
}
