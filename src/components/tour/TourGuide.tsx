import { Joyride as ReactJoyride, type CallBackProps, type Step, STATUS } from "react-joyride";
import { useI18n } from "@/hooks/useI18n";
import { useSettingsStore } from "@/stores/settingsStore";
import type { TourStep } from "@/hooks/useTour";
import { useEffect, useState } from "react";

export interface TourGuideProps {
  steps: TourStep[];
  run: boolean;
  onFinish: () => void;
  onSkip: () => void;
}

export default function TourGuide({ steps, run, onFinish, onSkip }: TourGuideProps) {
  const { t } = useI18n();
  const theme = useSettingsStore((s) => s.theme);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (theme === "dark") {
      setIsDark(true);
    } else if (theme === "light") {
      setIsDark(false);
    } else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mq.matches);
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  const handleCallback = (data: CallBackProps) => {
    const { status, action } = data;
    if (status === STATUS.FINISHED) {
      onFinish();
    } else if (status === STATUS.SKIPPED) {
      onSkip();
    } else if (action === "close") {
      onSkip();
    }
  };

  const joyrideSteps: Step[] = steps.map((s) => ({
    target: s.target,
    title: s.title,
    content: s.content,
    placement: s.placement ?? "bottom",
    skipBeacon: true,
  }));

  return (
    <ReactJoyride
      steps={joyrideSteps}
      run={run}
      continuous
      showSkipButton
      hideCloseButton={false}
      scrollToFirstStep
      disableOverlayClose
      disableScrolling={false}
      spotlightClicks
      locale={{
        back: t("tourButtonBack"),
        close: t("tourButtonClose"),
        last: t("tourButtonLast"),
        next: t("tourButtonNext"),
        skip: t("tourButtonSkip"),
      }}
      styles={{
        options: {
          primaryColor: isDark ? "#818cf8" : "#4f46e5",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "0.5rem",
          padding: "0.75rem",
          fontSize: "0.875rem",
        },
        tooltipContainer: {
          textAlign: "left" as const,
        },
        tooltipTitle: {
          fontSize: "1rem",
          fontWeight: 600,
        },
        tooltipContent: {
          marginTop: "0.25rem",
        },
        tooltipFooter: {
          marginTop: "0.75rem",
        },
        buttonNext: {
          borderRadius: "0.375rem",
          fontSize: "0.875rem",
          padding: "0.5rem 1rem",
        },
        buttonBack: {
          borderRadius: "0.375rem",
          fontSize: "0.875rem",
          marginRight: "0.5rem",
        },
        buttonSkip: {
          color: isDark ? "#9ca3af" : "#6b7280",
        },
        buttonClose: {
          color: isDark ? "#9ca3af" : "#6b7280",
        },
      }}
      callback={handleCallback}
    />
  );
}