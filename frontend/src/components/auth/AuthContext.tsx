"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch, invalidateApiCache } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<AuthUser | null>;
  logout: (redirectTo?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: AuthUser | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const baseKey = initialUser
    ? `${initialUser.id}:${initialUser.role}:${initialUser.name}`
    : "guest";
  const [clientOverride, setClientOverride] = useState<{
    baseKey: string;
    user: AuthUser | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const user =
    clientOverride && clientOverride.baseKey === baseKey
      ? clientOverride.user
      : initialUser;

  const setUser = useCallback(
    (nextUser: AuthUser | null) => {
      invalidateApiCache("/progress");
      invalidateApiCache("/study");
      invalidateApiCache("/learn");
      invalidateApiCache("/practice");
      setClientOverride({ baseKey, user: nextUser });
    },
    [baseKey]
  );

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{
        authenticated: boolean;
        user: AuthUser | null;
      }>("/auth/me");
      const next = data?.authenticated ? data.user : null;
      setClientOverride({ baseKey, user: next });
      return next;
    } catch {
      setClientOverride({ baseKey, user: null });
      return null;
    } finally {
      setLoading(false);
    }
  }, [baseKey]);

  const logout = useCallback(
    async (redirectTo = "/") => {
      setLoading(true);
      try {
        await apiFetch("/auth/logout", { method: "POST" });
      } catch {
        // Clear local state even if network call fails
      } finally {
        invalidateApiCache();
        setClientOverride({ baseKey, user: null });
        setLoading(false);
        router.push(redirectTo);
        router.refresh();
      }
    },
    [baseKey, router]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      setUser,
      refreshUser,
      logout,
    }),
    [user, loading, setUser, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
