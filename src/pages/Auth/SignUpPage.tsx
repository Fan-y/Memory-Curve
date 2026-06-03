import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useI18n } from "@/hooks/useI18n";
import { useAuthStore } from "@/stores/authStore";

export default function SignUpPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signUp = useAuthStore((state) => state.signUp);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useDocumentTitle(`${t("signUpTitle")} - Memory Curve`);

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setError(t("signUpValidationMissingCredentials"));
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

    if (result.code === "AUTH_SIGN_UP_EMAIL_VERIFICATION_REQUIRED") {
      setMessage(t("signUpSuccessNeedsVerification"));
      return;
    }

    setMessage(t("signUpSuccessLoggedIn"));

    if (result.code === "AUTH_SIGN_UP_SUCCESS") {
      navigate("/", { replace: true });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">{t("signUpHeading")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("signUpSubtitle")}</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("signUpDisplayNameLabel")}</label>
          <Input
            type="text"
            placeholder={t("signUpDisplayNamePlaceholder")}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>

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
          {submitting ? t("authSubmitting") : t("signUpSubmit")}
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap justify-end gap-1 text-sm">
        <Link className="text-primary hover:underline" to="/auth/login">
          {t("signUpAlreadyHaveAccount")} {t("signUpGoLogin")}
        </Link>
      </div>
    </div>
  );
}
