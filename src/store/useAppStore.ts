import { create } from 'zustand';

type Role = 'rider' | 'driver' | 'admin';

interface User {
  name: string;
  email: string;
  role: Role | null;
}

interface AppState {
  user: User | null;
  isSignInOpen: boolean;
  isSignUpOpen: boolean;
  activeVehicle: 'economy' | 'premium' | 'suv';
  driverOnline: boolean;

  login: (email: string, name: string, role?: Role | null) => void;
  logout: () => void;
  openSignIn: () => void;
  openSignUp: () => void;
  closeModals: () => void;
  setVehicle: (v: AppState['activeVehicle']) => void;
  toggleDriverOnline: () => void;
}

function inferRole(email: string): Role | null {
  const lower = email.toLowerCase();
  if (lower.startsWith('admin@'))  return 'admin';
  if (lower.startsWith('driver@')) return 'driver';
  if (lower.startsWith('rider@'))  return 'rider';
  return 'rider'; // default fallback
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isSignInOpen: false,
  isSignUpOpen: false,
  activeVehicle: 'premium',
  driverOnline: false,

  login: (email, name, role) =>
    set({
      user: { email, name, role: role ?? inferRole(email) },
      isSignInOpen: false,
      isSignUpOpen: false,
    }),

  logout: () => set({ user: null }),

  openSignIn: () => set({ isSignInOpen: true, isSignUpOpen: false }),
  openSignUp: () => set({ isSignUpOpen: true, isSignInOpen: false }),
  closeModals: () => set({ isSignInOpen: false, isSignUpOpen: false }),

  setVehicle: (v) => set({ activeVehicle: v }),
  toggleDriverOnline: () => set((s) => ({ driverOnline: !s.driverOnline })),
}));
