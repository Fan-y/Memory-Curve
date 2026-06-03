import { useMemo } from "react";

import { messages, type MessageKey } from "@/lib/i18n/messages";
import { useSettingsStore } from "@/stores/settingsStore";

export function useI18n() {
  const locale = useSettingsStore((state) => state.locale);

  const dictionary = useMemo(() => {
    return messages[locale] ?? messages["zh-CN"];
  }, [locale]);

  const t = (key: MessageKey): string => {
    return dictionary[key] ?? messages["zh-CN"][key] ?? key;
  };

  return {
    locale,
    t,
  };
}
