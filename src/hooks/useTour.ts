import { useCallback, useEffect, useState } from "react";
import { getProfile, updateProfile } from "@/lib/api/profiles";
import { useI18n } from "@/hooks/useI18n";
import { useAuthStore } from "@/stores/authStore";

const STORAGE_KEY = "memory-curve-tour-completed";

function getStoredCompleted(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredCompleted(value: string) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
}

interface UseTourOptions {
  todayEmpty: boolean;
}

export interface UseTourReturn {
  shouldRun: boolean;
  steps: TourStep[];
  introduceCompletedAt: string | null;
  loading: boolean;
  completeTour: () => Promise<void>;
  skipTour: () => Promise<void>;
}

export function useTour({ todayEmpty }: UseTourOptions): UseTourReturn {
  const { t } = useI18n();
  const [introduceCompletedAt, setIntroduceCompletedAt] = useState<string | null>(() => getStoredCompleted());
  const [loading, setLoading] = useState(true);

  const allSteps: TourStep[] = [
    {
      target: '[data-tour="dashboard-section-today"]',
      title: t("tourStepTodayTitle"),
      content: t("tourStepTodayContent"),
      placement: "bottom",
    },
    {
      target: '[data-tour="nav-add-entry"]',
      title: t("tourStepAddEntryTitle"),
      content: t("tourStepAddEntryContent"),
      placement: "top",
    },
    ...(todayEmpty
      ? []
      : [
          {
            target: '[data-tour="dashboard-review-card"]',
            title: t("tourStepReviewTitle"),
            content: t("tourStepReviewContent"),
            placement: "top" as const,
          },
        ]),
    {
      target: '[data-tour="dashboard-done"]',
      title: t("tourStepDoneTitle"),
      content: t("tourStepDoneContent"),
      placement: "center" as const,
    },
  ];

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      const user = useAuthStore.getState().user;
      if (!user) {
        setLoading(false);
        return;
      }

      const stored = getStoredCompleted();
      if (stored) {
        setIntroduceCompletedAt(stored);
        setLoading(false);
        return;
      }

      const result = await getProfile(user.id);
      if (cancelled) return;

      if (result.error) {
        console.warn("[useTour] Failed to load profile:", result.error);
        setLoading(false);
        return;
      }

      const value = result.data?.introduce_completed_at ?? null;
      if (value) {
        setStoredCompleted(value);
        setIntroduceCompletedAt(value);
      }
      setLoading(false);
    };
    void fetch();
    return () => {
      cancelled = true;
    };
  }, []);

  const markTourDone = useCallback(async () => {
    const now = new Date().toISOString();
    setStoredCompleted(now);
    setIntroduceCompletedAt(now);

    const user = useAuthStore.getState().user;
    if (!user) return;

    const result = await updateProfile(user.id, { introduce_completed_at: now });
    if (result.error) {
      console.warn("[useTour] Failed to save tour completion:", result.error);
    }
  }, []);

  const shouldRun = !loading && introduceCompletedAt === null;

  return {
    shouldRun,
    steps: allSteps,
    introduceCompletedAt,
    loading,
    completeTour: markTourDone,
    skipTour: markTourDone,
  };
}