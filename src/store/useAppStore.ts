import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiSignIn, apiSignUp, apiSignOut, apiGetMe, type SignUpPayload } from '@/lib/api';

export type Role = 'rider' | 'driver' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

interface AppState {
  // ── Auth ─────────────────────────────────────────────────────
  user: User | null;
  authLoading: boolean;
  authError: string | null;

  // ── Modals (kept for backward-compat, pages are preferred) ───
  isSignInOpen: boolean;
  isSignUpOpen: boolean;

  // ── Ride / Driver UX ─────────────────────────────────────────
  activeVehicle: 'economy' | 'premium' | 'suv';
  driverOnline: boolean;

  // ── Actions ──────────────────────────────────────────────────
  signIn:  (emailOrPhone: string, password: string) => Promise<string>;
  signUp:  (payload: SignUpPayload) => Promise<string>;
  logout:  () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearAuthError: () => void;

  // kept for legacy modal usage
  login: (email: string, name: string) => void;
  openSignIn: () => void;
  openSignUp: () => void;
  closeModals: () => void;

  setVehicle: (v: AppState['activeVehicle']) => void;
  toggleDriverOnline: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Initial state ───────────────────────────────────────
      user: null,
      authLoading: false,
      authError: null,
      isSignInOpen: false,
      isSignUpOpen: false,
      activeVehicle: 'premium',
      driverOnline: false,

      clearAuthError: () => set({ authError: null }),

      // ── Real sign-in → Flask /api/auth/login ─────────────────
      signIn: async (emailOrPhone, password) => {
        set({ authLoading: true, authError: null });
        try {
          const { user, redirect } = await apiSignIn(emailOrPhone, password);
          set({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            authLoading: false,
            isSignInOpen: false,
          });
          return redirect; // '/rider' | '/driver' | '/admin'
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Sign-in failed';
          set({ authLoading: false, authError: msg });
          throw err;
        }
      },

      // ── Real sign-up → Flask /api/auth/signup ─────────────────
      signUp: async (payload) => {
        set({ authLoading: true, authError: null });
        try {
          const { user, redirect } = await apiSignUp(payload);
          set({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            authLoading: false,
            isSignUpOpen: false,
          });
          return redirect;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Sign-up failed';
          set({ authLoading: false, authError: msg });
          throw err;
        }
      },

      // ── Sign out ──────────────────────────────────────────────
      logout: async () => {
        await apiSignOut();
        set({ user: null, driverOnline: false });
      },

      // ── Restore session on page reload ────────────────────────
      restoreSession: async () => {
        // Skip if already loaded from persist
        if (get().user) return;
        const me = await apiGetMe();
        if (me) {
          set({ user: { id: me.id, name: me.name, email: me.email, role: me.role } });
        }
      },

      // ── Legacy mock login (used by old modal components) ──────
      login: (email, name) => {
        const role: Role =
          email.startsWith('admin@')  ? 'admin'  :
          email.startsWith('driver@') ? 'driver' : 'rider';
        set({ user: { id: 0, name, email, role }, isSignInOpen: false, isSignUpOpen: false });
      },

      openSignIn:  () => set({ isSignInOpen: true,  isSignUpOpen: false }),
      openSignUp:  () => set({ isSignUpOpen: true,   isSignInOpen: false }),
      closeModals: () => set({ isSignInOpen: false,  isSignUpOpen: false }),

      setVehicle: (v) => set({ activeVehicle: v }),
      toggleDriverOnline: () => set((s) => ({ driverOnline: !s.driverOnline })),
    }),
    {
      name: 'rideflow-auth', // localStorage key
      partialize: (state) => ({
        user: state.user,
        activeVehicle: state.activeVehicle,
      }),
    }
  )
);
