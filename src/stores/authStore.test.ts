import { beforeEach, describe, expect, it, vi } from "vitest";

describe("authStore", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("sets config error when supabase is not configured", async () => {
    vi.doMock("@/lib/supabase", () => ({
      getSupabaseClient: vi.fn(),
      isSupabaseConfigured: false,
      SUPABASE_CONFIG_ERROR: "missing config",
    }));

    const { useAuthStore } = await import("@/stores/authStore");

    useAuthStore.setState({
      loading: true,
      initialized: false,
      configError: null,
      session: null,
      user: null,
    });

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.initialized).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.configError).toBe("missing config");
  });

  it("returns config error in signIn when config is missing", async () => {
    vi.doMock("@/lib/supabase", () => ({
      getSupabaseClient: vi.fn(),
      isSupabaseConfigured: false,
      SUPABASE_CONFIG_ERROR: "missing config",
    }));

    const { useAuthStore } = await import("@/stores/authStore");
    const result = await useAuthStore.getState().signIn("a@b.com", "secret");

    expect(result.error).toBe("missing config");
  });
});
