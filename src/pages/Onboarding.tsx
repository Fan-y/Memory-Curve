import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useI18n } from "@/hooks/useI18n";

type GuideStep = {
  index: string;
  title: string;
  description: string;
  action: string;
  to: string;
};

export default function OnboardingPage() {
  const { t } = useI18n();

  useDocumentTitle(`${t("navGuide")} - Memory Curve`);

  const steps: GuideStep[] = [
    {
      index: "01",
      title: t("guideStepCaptureTitle"),
      description: t("guideStepCaptureDesc"),
      action: t("guideStepCaptureAction"),
      to: "/add",
    },
    {
      index: "02",
      title: t("guideStepReviewTitle"),
      description: t("guideStepReviewDesc"),
      action: t("guideStepReviewAction"),
      to: "/",
    },
    {
      index: "03",
      title: t("guideStepTrackTitle"),
      description: t("guideStepTrackDesc"),
      action: t("guideStepTrackAction"),
      to: "/stats",
    },
    {
      index: "04",
      title: t("guideStepOrganizeTitle"),
      description: t("guideStepOrganizeDesc"),
      action: t("guideStepOrganizeAction"),
      to: "/history",
    },
  ];

  const tips = [t("guideTip1"), t("guideTip2"), t("guideTip3")];

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm">
        <div className="pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative space-y-3">
          <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {t("guideBadge")}
          </span>
          <h2 className="text-2xl font-semibold tracking-tight">{t("guideTitle")}</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{t("guideSubtitle")}</p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Link to="/add">
              <Button>{t("guidePrimaryAction")}</Button>
            </Link>
            <Link to="/">
              <Button variant="outline">{t("guideSecondaryAction")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{t("guideSectionStepsTitle")}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {steps.map((step) => (
            <article key={step.index} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <span className="inline-flex rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {step.index}
                  </span>
                  <h4 className="text-base font-semibold">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>

              <div className="mt-4">
                <Link to={step.to}>
                  <Button variant="outline" size="sm">
                    {step.action}
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-semibold">{t("guideSectionTipsTitle")}</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
