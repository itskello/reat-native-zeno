Read AGENTS.md first and follow it strictly.

Implement the "Set Up PIN" screen exactly as shown in the attached design. 
Layout: back button (top-left), headline "Set Up PIN", subtext "Create a 
4-digit PIN to secure your account.", a row of 4 rounded input boxes 
(light lavender background, active box shown with a blue cursor), a custom 
on-screen numeric keypad (1-9, 0 centered on the bottom row, backspace "<" 
bottom-right), and a "Continue" primary button at the bottom.

Behavior:
- Back button returns to the previous verification step.
- Use the custom on-screen keypad shown in the design (not the native device 
  number pad) — tapping a digit fills the next empty PIN box; tapping "<" 
  removes the last entered digit.
- Each PIN box shows a blue cursor when it's the next one to be filled, and 
  displays the digit (or a masked dot, per ZENO's security convention — 
  confirm which) once filled.
- "Continue" is disabled until all 4 digits are entered, then becomes active.
- On "Continue", navigate to the PIN confirmation step ("re-enter your PIN" 
  screen) rather than completing setup immediately — the PIN must be entered 
  twice to confirm before being saved.
- If the confirmation PIN doesn't match, show an inline error and return the 
  user to re-enter both PIN attempts.

Note: fix the typo visible in the design copy — "Creat a 4-digit PIN" → 
"Create a 4-digit PIN" — since this is a content error, not an intentional 
design choice.

Security note:
This PIN is used to authorize sensitive financial actions (e.g. confirming 
Send Money, Withdraw Money) later in the Wallet flow. Per AGENTS.md fintech 
security rules, the PIN must never be stored or validated in plain text on 
the client — store it via Clerk's PIN/passcode mechanism if supported, or 
flag the correct secure backend approach before implementing if Clerk 
doesn't natively support a transaction PIN separate from the account password.


@prompt_material/13 Set Up PIN (création).png