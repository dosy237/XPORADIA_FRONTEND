import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { secureStorage } from "@/services/secureStorage";
import type { User, UserRole } from "@/types/user";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  currentRole: UserRole | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (payload: { user: User; access: string; refresh: string }) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateUser: (data: Partial<User>) => void;
  setAccessToken: (accessToken: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      currentRole: null,
      isAuthenticated: false,
      hasHydrated: false,

      login: ({ user, access, refresh }) =>
        set({
          user,
          accessToken: access,
          refreshToken: refresh,
          currentRole: user.primary_role,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          currentRole: null,
          isAuthenticated: false,
        }),

      switchRole: (role) => {
        const { user } = get();
        if (user?.all_roles?.includes(role)) set({ currentRole: role });
      },

      updateUser: (data) =>
        set((state) => ({ user: state.user ? { ...state.user, ...data } : state.user })),

      setAccessToken: (accessToken) => set({ accessToken }),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "xporadia-auth",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        currentRole: state.currentRole,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
