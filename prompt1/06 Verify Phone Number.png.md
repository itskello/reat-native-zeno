Read AGENTS.md first and follow it strictly.

Implement the "Verify Phone Number" screen exactly as shown in the attached 
design. Layout: back button (top-left), headline "Verify Phone Number", 
subtext "Enter The 6-Digit Code Sent To" followed by the phone number in 
bold beneath it, a 6-digit OTP input (individual boxes with underline style, 
active box shown with a blue cursor, filled digits shown in blue bold), and 
a "Resend Code In 00:45" countdown timer beneath it (timer text in blue, 
counting down from 45 seconds).

Behavior:
- Back button returns to the previous screen (Create Account).
- The phone number shown must be dynamically pulled from the phone number 
  entered on the Create Account screen (already synced via the auth/onboarding 
  store), not hardcoded.
- Digit input uses the number pad keyboard, auto-advances focus to the next 
  box as each digit is typed, and auto-submits/verifies once all 6 digits 
  are entered — no separate "Continue" button needed.
- On successful verification, navigate to the next Sign Up step (PIN setup).
- On invalid/expired code, show a clear inline error and clear the input 
  for retry.
- "Resend Code" becomes tappable only after the countdown reaches 00:00; 
  before that, it's shown as disabled countdown text as in the reference. 
  Tapping it (once enabled) re-triggers the OTP send via Clerk and resets 
  the 45-second timer.

Clerk integration:
Reuse the existing Clerk phone verification flow already established for 
this project — this screen should call Clerk's phone number verification 
API (attempt/verify) rather than introducing a separate OTP system.


@prompt_material/8 Verify Phone Number.png