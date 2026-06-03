import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

import { trackEvent } from "@/lib/api/analytics";
import {
  getSupabaseClient,
  isSupabaseConfigured,
  SUPABASE_CONFIG_ERROR,
} from "@/lib/supabase";

export type OAuthProvider = "google" | "github";

export type AuthActionCode =
  | "AUTH_SIGN_UP_EMAIL_VERIFICATION_REQUIRED"
  | "AUTH_SIGN_UP_SUCCESS"
  | "AUTH_OAUTH_REDIRECTING"
  | "AUTH_RESET_PASSWORD_EMAIL_SENT";

export type AuthActionResult = {
  error: string | null;
  code?: AuthActionCode;
};

type AuthState = {
  loading: boolean;
  initialized: boolean;
  configError: string | null;
  session: Session | null;
  user: User | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<AuthActionResult>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
  resetPassword: (email: string) => Promise<AuthActionResult>;
};

let unsubscribeAuthListener: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  loading: true,
  initialized: false,
  configError: null,
  session: null,
  user: null,

  initialize: async () => {
    if (get().initialized) {
      return;
    }

    if (!isSupabaseConfigured) {
      set({
        loading: false,
        initialized: true,
        configError: SUPABASE_CONFIG_ERROR,
      });
      return;
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      set({
        loading: false,
        initialized: true,
        configError: error.message,
      });
      return;
    }

    set({
      loading: false,
      initialized: true,
      session: data.session,
      user: data.session?.user ?? null,
      configError: null,
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
      });
    });

    unsubscribeAuthListener?.();
    unsubscribeAuthListener = () => {
      listener.subscription.unsubscribe();
    };
  },

  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: SUPABASE_CONFIG_ERROR };
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  },

  signUp: async (email: string, password: string, displayName?: string) => {
    if (!isSupabaseConfigured) {
      return { error: SUPABASE_CONFIG_ERROR };
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: displayName ? { display_name: displayName } : undefined,
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (!data.session) {
      return {
        error: null,
        code: "AUTH_SIGN_UP_EMAIL_VERIFICATION_REQUIRED",
      };
    }

    void trackEvent(data.user.id, "register");

    return {
      error: null,
      code: "AUTH_SIGN_UP_SUCCESS",
    };
  },

  signInWithOAuth: async (provider: OAuthProvider) => {
    if (!isSupabaseConfigured) {
      return { error: SUPABASE_CONFIG_ERROR };
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return {
      error: null,
      code: "AUTH_OAUTH_REDIRECTING",
    };
  },

  signOut: async () => {
    if (!isSupabaseConfigured) {
      return { error: SUPABASE_CONFIG_ERROR };
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  },

  resetPassword: async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: SUPABASE_CONFIG_ERROR };
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return {
      error: null,
      code: "AUTH_RESET_PASSWORD_EMAIL_SENT",
    };
  },
}));
