Read AGENTS.md first and follow it strictly.

Implement the "Create Account" screen exactly as shown in the attached design. 
Layout: back button (top-left), headline "Create Account", subtext "Let's Get 
You Started", "Login With Google" button, "OR" divider, then form fields: 
Email address, Phone number (with country flag + dial code prefix), Password 
(with helper text "Your password must be at least 9 characters, containing a 
letter and a number" and a show/hide eye icon), Re-type the Password (same 
show/hide behavior), and a "Continue" primary button at the bottom.

Data sync requirement (important):
- The country selected on the previous "Where Do You Live" screen must be 
  carried forward into this screen's global/store state (e.g. via the 
  auth/onboarding Zustand store).
- The Phone number field's country flag and dial code must be pre-filled 
  automatically based on that previously selected country (e.g. Benin → 
  🇧🇯 +229, Côte d'Ivoire → 🇨🇮 +225, Togo → 🇹🇬 +228) — the user should not 
  need to re-select it here.
- Tapping the flag/dial code prefix still allows the user to change it 
  manually (in case they want a different country's number), but it should 
  never start empty or unset if a country was already chosen upstream.

Validation:
- Email: standard email format validation.
- Phone: validate against the selected country's number format/length.
- Password: minimum 9 characters, must contain at least one letter and one 
  number; show real-time validation feedback.
- Re-type Password: must match Password exactly before "Continue" is enabled.
- "Continue" button is disabled until all fields are valid, then becomes active.

Navigation:
- Back button returns to the "Where Do You Live" screen.
- "Login With Google" triggers the Google OAuth flow (Clerk).
- "Continue" navigates to the next Sign Up step (OTP/Email verification), 
  passing along the collected form data.

Note: fix the typos visible in the design copy when implementing the actual 
text — "Creat Account" → "Create Account" and "Let's Get You Stared" → "Let's 
Get You Started" — since these are content errors, not intentional design choices.

@prompt_material/6 Create Account.png