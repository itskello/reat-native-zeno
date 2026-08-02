Read AGENTS.md first and follow it strictly.

Implement the three biometric/fingerprint setup screens shown in the 
attached designs, with the corrected flow logic below (this is not a 
Face ID vs Fingerprint distinction — it's a single linear flow).

**Screen 1 — Biometric Set Up (generic consent screen):**
Layout: back button (top-left), headline "Biometric Set Up", subtext "Use 
biometrics to login and authorize transaction", centered padlock 
illustration, benefits list ("Faster login", "More secure", "Easy payments 
approval"), "Enable Biometrics" primary button, "Maybe Later" text link.

Behavior:
- This screen is a generic consent/intro step — it does NOT detect or 
  reference Face ID specifically. It simply asks if the user wants to set 
  up biometric security at all.
- Tapping "Enable Biometrics" navigates to Screen 2 (Fingerprint), which 
  performs the actual native enrollment.
- Tapping "Maybe Later" skips biometric setup entirely (store preference 
  as disabled/skipped) and navigates directly to the Onboarding Complete 
  screen (Screen 4, described below — not yet implemented).

**Screen 2 — Fingerprint (enrollment):**
Layout: back button (top-left), headline "Fingerprint", subtext "Strengthen 
security with your fingerprint", centered fingerprint icon illustration, 
same benefits list, "Set Up Fingerprint" primary button, "Maybe Later" 
text link.

Behavior:
- Reached only after tapping "Enable Biometrics" on Screen 1.
- Back button returns to Screen 1.
- "Set Up Fingerprint" triggers the native fingerprint enrollment/authentication 
  prompt (Expo LocalAuthentication or equivalent already used in the project).
  - On success: store the biometric preference (enabled) in the auth/security 
    store, then navigate to Screen 3 (Fingerprint Success).
  - On failure: show a clear inline message; "Maybe Later" remains available 
    to skip and go straight to the Onboarding Complete screen.

**Screen 3 — Fingerprint Success:**
Layout: headline "Fingerprint", subtext "You're all set!", fingerprint icon 
with a blue checkmark overlay (BIO - biometric valide.png), confirmation text "You can now access your 
account and pay using your fingerprint.", "Done" primary button. No back 
button (enrollment already succeeded).

Behavior:
- "Done" navigates to the Onboarding Complete screen.

**Onboarding Complete screen (new — not yet implemented):**
This screen is the single convergence point for all paths above (Screen 1's 
"Maybe Later", Screen 2's failure/"Maybe Later", and Screen 3's "Done"). Its 
purpose is functional, not just decorative: it shows the ZENO logo on the 
dark background (reuse the existing Intro/Splash visual style, no lock icon, 
no tagline) while the app preloads and initializes everything needed for 
Wallet Home in the background (session state, wallet balance fetch, initial 
transactions, etc.) — so the user is never dropped onto a blank or 
half-loaded Wallet Home screen.

Behavior:
- No user interaction, no buttons, no back navigation.
- While this screen is showing, kick off all necessary data fetching/session 
  setup for Wallet Home.
- Once loading completes (or after a minimum display duration, e.g. 1.5–2 
  seconds, whichever is longer, to avoid an distracting flash), automatically 
  navigate to the home route (/) — Wallet Home — fully loaded and ready.
- If loading fails (e.g. network error), handle gracefully — retry or show 
  a minimal error state rather than navigating to a broken Wallet Home.

Note: fix the content issues visible in the designs — Screen 2 and 3 mix 
French and English copy inconsistently ("Renforcer la sécurité avec votre 
empreinte" / "Bravo, vous êtes prêt !" / "Config Fingerprint" / "empreint 
digital"). Since the rest of ZENO's UI is in English, use consistent English 
copy throughout: Screen 2 subtext "Strengthen security with your fingerprint", 
button "Set Up Fingerprint"; Screen 3 subtext "You're all set!", confirmation 
text "You can now access your account and pay using your fingerprint." — 
unless you specifically want French kept, in whicxh case confirm before 
implementation.

@prompt_material/14 Biometric Setup.png
@prompt_material/15 Fingerprint (proposition).png
@prompt_material/16 Fingerprint (succès).png

asset icone 
@assets/images/BIO - setup fingprint.png
@assets/images/BIO - biometric valide.png  