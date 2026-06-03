import { create } from "zustand";
import { getUserEntries, type EntryRow } from "@/lib/api/entries";

type EntryCacheStore = {
  entries: EntryRow[] | null;
  loading: boolean;
  fetch: (userId: string, force?: boolean) => Promise<void>;
};

export const useEntryCacheStore = create<EntryCacheStore>((set) => ({
  entries: null,
  loading: false,
  fetch: async (userId: string, force = false) => {
    const { entries, loading: isLoading } = useEntryCacheStore.getState();
    if (entries && !force) return;
    if (isLoading) return;
    const result = await getUserEntries(userId);
    if (!result.error) {
      set({ entries: result.data ?? [], loading: false });
    } else {
      set({ loading: false });
    }
  },
}));