import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AuthPermissions,
  AuthSession,
  AuthUser,
  MenuAccess,
} from '@/features/auth/types';

const LEGACY_SESSION_KEY = 'session';

function writeLegacySession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  const legacy = {
    token: session.token,
    data: session.user,
    permissions: session.permissions,
    menu_access: session.menuAccess,
  };
  localStorage.setItem(LEGACY_SESSION_KEY, JSON.stringify(legacy));
}

function clearLegacySession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LEGACY_SESSION_KEY);
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  permissions: AuthPermissions | null;
  menuAccess: MenuAccess;
  isAuthenticated: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      permissions: null,
      menuAccess: {},
      isAuthenticated: false,
      setSession: (session) => {
        writeLegacySession(session);
        set({
          token: session.token,
          user: session.user,
          permissions: session.permissions,
          menuAccess: session.menuAccess,
          isAuthenticated: true,
        });
      },
      clearSession: () => {
        clearLegacySession();
        set({
          token: null,
          user: null,
          permissions: null,
          menuAccess: {},
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        permissions: state.permissions,
        menuAccess: state.menuAccess,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
