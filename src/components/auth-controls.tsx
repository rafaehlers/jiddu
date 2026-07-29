"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import Link from "next/link";
import { createContext, useContext } from "react";
import { signOutAction } from "@/app/auth-actions";
import { useI18n } from "@/lib/i18n/provider";

type AuthControlsState = {
  enabled: boolean;
  isAdmin: boolean;
  hasPlatformAccess: boolean;
};

const AuthControlsContext = createContext<AuthControlsState>({
  enabled: false,
  isAdmin: false,
  hasPlatformAccess: false,
});

export function AuthControlsProvider({
  enabled,
  isAdmin = false,
  hasPlatformAccess = false,
  children,
}: {
  enabled: boolean;
  isAdmin?: boolean;
  hasPlatformAccess?: boolean;
  children: React.ReactNode;
}) {
  return (
    <AuthControlsContext.Provider
      value={{ enabled, isAdmin, hasPlatformAccess }}
    >
      {children}
    </AuthControlsContext.Provider>
  );
}

export function AuthControls() {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const { enabled, isAdmin } = useContext(AuthControlsContext);
  if (!enabled || loading) return null;

  const signIn =
    lang === "pt" ? "Entrar" : lang === "es" ? "Ingresar" : "Sign in";
  const signUp =
    lang === "pt"
      ? "Criar conta"
      : lang === "es"
        ? "Crear cuenta"
        : "Create account";
  const account = lang === "pt" ? "Conta" : lang === "es" ? "Cuenta" : "Account";
  const signOutLabel =
    lang === "pt" ? "Sair" : lang === "es" ? "Cerrar sesión" : "Sign out";
  const admin = "Admin";

  if (!user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden text-muted md:inline" aria-hidden>
          ·
        </span>
        <Link
          href="/login"
          className="text-sm text-muted hover:text-accent-hi transition-colors"
        >
          {signIn}
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          {signUp}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="hidden text-muted md:inline" aria-hidden>
        ·
      </span>
      <Link
        href="/account"
        className="text-sm text-muted hover:text-accent-hi transition-colors"
      >
        {account}
      </Link>
      {isAdmin && (
        <>
          <span className="text-muted" aria-hidden>
            ·
          </span>
          <Link
            href="/admin"
            className="text-sm text-muted hover:text-accent-hi transition-colors"
          >
            {admin}
          </Link>
        </>
      )}
      <span className="text-muted" aria-hidden>
        ·
      </span>
      <form action={signOutAction}>
        <button
          type="submit"
          className="text-sm text-muted hover:text-accent-hi transition-colors"
        >
          {signOutLabel}
        </button>
      </form>
    </div>
  );
}

export function useAuthControlsEnabled(): boolean {
  return useContext(AuthControlsContext).enabled;
}

export function usePlatformAccess(): boolean {
  return useContext(AuthControlsContext).hasPlatformAccess;
}
