Read AGENTS.md first and follow it strictly.

Implement the "Log In" screen exactly as shown in the attached design. 
Layout: back button (top-left), headline "Log In", subtext "Welcome Back", 
"Don't Have An Account? Create One" positioned right below the subtext, 
then form fields: Email or Phone number, Password (with lock icon and 
show/hide eye toggle), a right-aligned "Forgot Password?" link beneath the 
password field, a "Log In" primary button, an "OR Continue With" divider, 
and a "Login With Google" button at the bottom.

Behavior:
- Back button returns to the Welcome screen.
- "Create One" navigates to the Sign Up screen.
- "Forgot Password?" navigates to the Forgot Password flow.
- "Log In" validates the email/phone + password fields, then triggers 
  Clerk sign-in (see Clerk integration notes below).
- "Login With Google" triggers the Google OAuth flow via Clerk.
- On successful authentication, navigate to the home route (/).
- On failure (wrong credentials, unverified account, etc.), show a clear 
  inline error message without navigating away from the screen.

Note: fix the typos visible in the design copy when implementing the actual 
text — "Fogot Password?" → "Forgot Password?" and "Creat One" → "Create One" 
— since these are content errors, not intentional design choices.

Clerk integration:
Follow the same Clerk authentication approach already established for the 
Sign Up/verification flow — reuse the existing Clerk setup and session 
handling rather than introducing a separate auth path for Log In. If any 
part of the existing Clerk configuration doesn't support Email/Phone + 
Password sign-in as shown here, flag it and ask before implementing a 
workaround.

@prompt_material/7 Log In.png