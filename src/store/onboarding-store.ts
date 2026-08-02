import { SupportedCountry } from "@/data/countries";
import { create } from "zustand";

/**
 * How the account was started. Google sign-ups skip email verification because
 * Google already proved ownership of the address.
 */
export type SignUpMethod = "form" | "google";

type OnboardingState = {
  residencyCountry: SupportedCountry | null;
  phoneCountry: SupportedCountry | null;
  email: string;
  phoneNumber: string;
  signUpMethod: SignUpMethod | null;
  /**
   * Opaque token returned by /api/otp/send and replayed at /api/otp/verify.
   * It is a signed hash of the code — not the code itself — so holding it in
   * memory is safe; it never reveals or lets anyone forge the OTP.
   */
  phoneOtpToken: string | null;
  setResidencyCountry: (country: SupportedCountry) => void;
  setPhoneCountry: (country: SupportedCountry) => void;
  setAccountDetails: (details: { email: string; phoneNumber: string }) => void;
  setSignUpMethod: (method: SignUpMethod) => void;
  setPhoneOtpToken: (token: string | null) => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  residencyCountry: null,
  phoneCountry: null,
  email: "",
  phoneNumber: "",
  signUpMethod: null,
  phoneOtpToken: null,
  setResidencyCountry: (country) =>
    set({ residencyCountry: country, phoneCountry: country }),
  setPhoneCountry: (country) => set({ phoneCountry: country }),
  setAccountDetails: ({ email, phoneNumber }) => set({ email, phoneNumber }),
  setSignUpMethod: (method) => set({ signUpMethod: method }),
  setPhoneOtpToken: (token) => set({ phoneOtpToken: token }),
}));
