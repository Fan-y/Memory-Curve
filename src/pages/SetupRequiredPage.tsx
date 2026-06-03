import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useI18n } from "@/hooks/useI18n";

export default function SetupRequiredPage() {
  const { t } = useI18n();

  useDocumentTitle(`${t("setupTitle")} - Memory Curve`);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">{t("setupHeading")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("setupSubtitle")}</p>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
          <li>{t("setupStepEnv")}</li>
          <li>{t("setupStepSql")}</li>
          <li>{t("setupStepEmailProvider")}</li>
          <li>{t("setupStepRestart")}</li>
        </ol>

        <div className="mt-5 rounded-md border border-dashed p-4 text-xs text-muted-foreground">
          {t("setupTip")}
        </div>
      </div>
    </div>
  );
}
