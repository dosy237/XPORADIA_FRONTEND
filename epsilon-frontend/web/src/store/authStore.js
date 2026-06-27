import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      currentRole: null,
      isAuthenticated: false,

      login: ({ user, access, refresh }) => set({
        user,
        accessToken: access,
        refreshToken: refresh,
        currentRole: user.primary_role,
        isAuthenticated: true,
      }),

      logout: () => set({
        user: null, accessToken: null,
        refreshToken: null, currentRole: null,
        isAuthenticated: false,
      }),

      switchRole: (role) => {
        const { user } = get();
        if (user?.all_roles?.includes(role)) set({ currentRole: role });
      },

      updateUser: (data) => set((state) => ({
        user: { ...state.user, ...data }
      })),
    }),
    {
      name: "xporadia-auth",
      partialize: (state) => ({
        user: state.user, accessToken: state.accessToken,
        refreshToken: state.refreshToken, currentRole: state.currentRole,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
