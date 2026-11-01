import { create } from "zustand";

type AuthTransitionState = {
  isSigningOut: boolean;
  setSigningOut: (isSigningOut: boolean) => void;
};

/** Keeps auth transition feedback mounted while Clerk changes the active route. */
export const useAuthTransitionStore = create<AuthTransitionState>((set) => ({
  isSigningOut: false,
  setSigningOut: (isSigningOut) => set({ isSigningOut }),
}));
