import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";
import type { TourStep } from "@/hooks/useTour";
import { cn } from "@/lib/utils";

export interface TourGuideProps {
  steps: TourStep[];
  run: boolean;
  onFinish: () => void;
  onSkip: () => void;
}

function getElement(target: string): HTMLElement | null {
  return document.querySelector(target);
}

function computeTooltipPosition(
  el: HTMLElement,
  placement: TourStep["placement"]
): { top: number; left: number } {
  const rect = el.getBoundingClientRect();
  const gap = 12;
  const horizontalCenter = rect.left + rect.width / 2;

  switch (placement) {
    case "top":
      return { top: rect.top - gap, left: horizontalCenter };
    case "bottom":
      return { top: rect.bottom + gap, left: horizontalCenter };
    case "left":
      return { top: rect.top + rect.height / 2, left: rect.left - gap };
    case "right":
      return { top: rect.top + rect.height / 2, left: rect.right + gap };
    case "center":
    default:
      return {
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
      };
  }
}

export default function TourGuide({ steps, run, onFinish, onSkip }: TourGuideProps) {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[current];
  const isLast = current === steps.length - 1;

  const updatePosition = useCallback(() => {
    if (!step || step.placement === "center") {
      setSpotlightRect(null);
      setPos({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
      return;
    }
    const el = getElement(step.target);
    if (!el) {
      setSpotlightRect(null);
      setPos({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const tooltipPos = computeTooltipPosition(el, step.placement);
    setPos(tooltipPos);
    setSpotlightRect(el.getBoundingClientRect());
  }, [step]);

  useEffect(() => {
    if (!run) return;
    updatePosition();
    const handle = () => updatePosition();
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, { passive: true });
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle);
    };
  }, [run, updatePosition]);

  const goNext = () => {
    if (isLast) {
      onFinish();
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const goPrev = () => {
    if (current === 0) return;
    setCurrent((c) => c - 1);
  };

  if (!run || !step) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-black/50" onClick={onSkip} />
      {spotlightRect ? (
        <div
          className="fixed z-[10000] rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
          style={{
            top: spotlightRect.top - 4,
            left: spotlightRect.left - 4,
            width: spotlightRect.width + 8,
            height: spotlightRect.height + 8,
          }}
        />
      ) : null}
      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[10001] w-72 rounded-xl border bg-card p-4 shadow-lg -translate-x-1/2 -translate-y-1/2",
          step.placement === "top" ? "-translate-y-full" : ""
        )}
        style={{ top: step.placement === "center" ? "50%" : pos.top, left: pos.left }}
      >
        <h4 className="text-sm font-semibold">{step.title}</h4>
        <p className="mt-2 text-xs text-muted-foreground">{step.content}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "block h-1.5 rounded-full transition-all",
                  i === current ? "w-4 bg-primary" : "w-1.5 bg-muted"
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={onSkip}>
              {t("tourButtonSkip")}
            </Button>
            {current > 0 ? (
              <Button variant="outline" size="sm" onClick={goPrev}>
                {t("tourButtonBack")}
              </Button>
            ) : null}
            <Button size="sm" onClick={goNext}>
              {isLast ? t("tourButtonLast") : t("tourButtonNext")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}