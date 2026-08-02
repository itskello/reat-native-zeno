Read AGENTS.md first and follow it strictly.

Implement the "Where Do You Live" screen exactly as shown in the attached design. 
Layout: headline "Where Do You Live" (bold, large, left-aligned) at the top, 
subtext below it, a "Country Of Residency" label with a "Select Country" dropdown 
field beneath it, and "Already Have An Account? Login" centered at the bottom 
above the "Create Account" primary button.

Behavior:
- Tapping the "Select Country" field opens a bottom sheet modal titled "Countries" 
  with a search input ("Search Countries") and a scrollable list of countries, 
  each row showing a circular flag icon, country name with ISO code (e.g. 
  "Benin (BEN)"), and a chevron.
- Selecting a country from the list closes the bottom sheet and displays the 
  selected country as a filled card below the dropdown (flag icon + country name, 
  no ISO code shown at this stage), matching the "Benin" selected state in the 
  reference.
- The "Create Account" button is disabled (greyed out, non-interactive) until a 
  country is selected, then becomes active (ZENO Green, tappable) once one is chosen.
- "Login" navigates to the Login screen.
- Once active, "Create Account" navigates to the next Sign Up step.

Create `data/countries.ts` with typed country entries (name, ISO code, flag), 
seeded with only ZENO's actual supported markets: Benin (BEN), Côte d'Ivoire (CIV), 
and Togo (TGO) — structured so more countries can be added later as ZENO expands.

Note: fix the typo visible in the design copy when implementing the actual 
placeholder text — "Search Contries" → "Search Countries" — since this is a 
content error, not an intentional design choice.

@prompt_material/3 Where Do You Live (closed).png
@prompt_material/4 Where Do You Live (open list).png