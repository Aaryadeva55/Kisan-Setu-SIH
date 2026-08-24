import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrated: false,

  setSession: (user, accessToken) => {
    set({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isHydrated: true,
    });
  },

  setLoading: (loading) => {
    set({ isHydrated: !loading });
  },

  clear: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  },
}));
