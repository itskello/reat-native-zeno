Read AGENTS.md first and follow it strictly.

Implement the email verification step, which consists of two screens shown 
in the attached designs:

1. "Verify Email" (intro screen) — headline "Verify Email", subtext "The 
   verification code will be sent to" followed by the user's email in bold, 
   and a "Continue" primary button at the bottom. Tapping "Continue" triggers 
   sending the email verification code (via Clerk) and navigates to screen 2.

2. "Verify Email" (code entry screen) — same layout as the existing "Verify 
   Phone Number" screen: headline "Verify Email", subtext "Enter The 6-Digit 
   Code Sent To" followed by the email in bold, a 6-digit OTP input (auto-focus, 
   auto-advance, auto-submit on last digit), and a "Resend Code In 00:45" 
   countdown timer.

Signup verification flow logic (important):
- If the user signed up via "Login With Google": skip both email verification 
  screens entirely. Only phone number verification is required (Google already 
  verifies email ownership).
- If the user signed up via the direct Create Account form (email + phone + 
  password): after submitting the form, the flow is:
  Create Account → Verify Phone Number (auto-sends code, 6-digit input) → 
  on success → Verify Email intro screen → tap "Continue" (sends email code) → 
  Verify Email code entry screen (6-digit input) → on success → next step 
  (Create PIN).
- Phone verification always happens before email verification in the direct 
  signup path.

Note: fix the typo visible in the design copy — "The verification code wil 
be send to" → "The verification code will be sent to" — since this is a 
content error, not an intentional design choice.

Clerk integration:
Use Clerk's email verification (prepareEmailAddressVerification / 
attemptEmailAddressVerification or equivalent) for the email OTP, following 
the same pattern already used for phone verification. Keep both verification 
states tracked in the auth/onboarding store so the flow can correctly skip 
email verification for Google sign-ups.


@prompt_material/9 Verify Email.png
@prompt_material/10 Verify Email code.png

