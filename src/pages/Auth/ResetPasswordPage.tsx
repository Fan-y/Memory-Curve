import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useI18n } from "@/hooks/useI18n";
import { useAuthStore } from "@/stores/authStore";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const resetPassword = useAuthStore((state) => state.resetPassword);

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useDocumentTitle(`${t("resetPasswordTitle")} - Memory Curve`);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email) {
      setError(t("resetPasswordValidationMissingEmail"));
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

    if (result.code === "AUTH_RESET_PASSWORD_EMAIL_SENT") {
      setMessage(t("resetPasswordSuccess"));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">{t("resetPasswordHeading")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("resetPasswordSubtitle")}</p>

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

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? t("authSubmitting") : t("resetPasswordSubmit")}
        </Button>
      </form>

      <div className="mt-4 text-right text-sm">
        <Link className="text-primary hover:underline" to="/auth/login">
          {t("authBackToLogin")}
        </Link>
      </div>
    </div>
  );
}
