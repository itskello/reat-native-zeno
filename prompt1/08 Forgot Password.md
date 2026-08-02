Read AGENTS.md first and follow it strictly.

Implement the "Forgot Password" flow shown in the two attached designs 
(code-based reset, not link-based):

**Screen 1 — Forgot Password:**
Layout: back button (top-left), headline "Forgot Password", subtext "No 
worries, we'll help you reset it", an "Email or Phone number" input field, 
and a primary button.

Behavior:
- Back button returns to the Log In screen.
- On tapping the button with a valid email or phone number entered, trigger 
  the password reset request (via Clerk, code-based strategy) and reveal the 
  confirmation card at the bottom: light blue rounded card, blue mail icon, 
  "We've sent a reset code to your email." and "Enter it on the next screen to reset your 
  password." beneath it.
- The confirmation card is hidden on initial load — only appears after a 
  successful send.
- After ~1.5 seconds (or immediately), auto-navigate to Screen 2.
- If the entered email/phone doesn't match any account, show a clear inline 
  error instead of the confirmation card.

**Screen 2 — Verify Reset Code:**
Layout: back button (top-left), headline "Verify Reset Code", subtext "Enter 
The 6-Digit Code Sent To" followed by the email/phone in bold, a 6-digit OTP 
input (auto-focus, auto-advance, auto-submit on last digit), and a "Resend 
Code In 00:45" countdown.

Behavior:
- Back button returns to Screen 1.
- The email/phone shown must be dynamically pulled from what was entered on 
  Screen 1.
- On successful code verification, navigate to the existing "Reset Password" 
  screen (new password + confirm password).
- On invalid/expired code, show a clear inline error and clear the input.
- "Resend Code" becomes tappable only after the countdown reaches 00:00; 
  tapping it re-sends the code and resets the 45-second timer.

Note: fix the typo visible in the Screen 1 design copy — "Fogot Password" → 
"Forgot Password" — since this is a content error, not an intentional 
design choice.

Clerk integration:
Use Clerk's password reset flow with a code-based strategy (e.g. 
reset_password_email_code, or the phone equivalent for phone numbers) 
consistent with the existing Clerk OTP setup already used for Verify Phone 
Number / Verify Email in this project.

@prompt_material/11 forgot password a.png
@prompt_material/11 forgot password b.png