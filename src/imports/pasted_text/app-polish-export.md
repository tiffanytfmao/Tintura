Now add the export function and do a final 
polish pass across the entire app. This is 
the last build step before the app is feature 
complete.

---

EXPORT (entry detail page):

When "Export card" is clicked, generate a PNG 
using HTML Canvas:
  Canvas size: 800 × 1000px
  Background: #F9F7F4 with the same warm dot 
  grid pattern used across the app 
  (radial-gradient, rgba(180,168,148,0.65), 
  24px spacing)
  
  Photo: drawn at top, 800px wide × 600px tall,
  object-fit cover
  
  If entry.isBlend: render the 50/50 split 
  treatment (blendPhotos[0] left half, 
  blendPhotos[1] right half) instead of a 
  single photo
  
  Palette strip: full width, 28px tall, 
  immediately below photo, one segment per 
  swatch color
  
  Entry anchor: DM Sans 500 14px uppercase 
  #1A1814, letter-spacing 0.06em, 
  padding 32px 40px 4px
  
  Entry name (the part after the anchor): 
  Cormorant Garamond 300 32px #1A1814, 
  padding 0 40px 8px
  
  Location + date: DM Mono 13px #8C8880, 
  padding 0 40px
  
  If isBlend: below location/date, add 
  "blended from [name1] × [name2]" in 
  Cormorant Garamond 300 italic 13px #8C8880
  
  "tintura" wordmark: Cormorant Garamond 300 
  italic 16px #8C8880, bottom-right corner, 
  padding 0 40px 32px

Trigger download via anchor element with 
download attribute and canvas.toDataURL
('image/png')

---

GLOBAL POLISH PASS:

1. PAGE TRANSITIONS:
Fade between routes: opacity 0 → 1, 200ms ease
Apply consistently across all pages: diary, 
roll, capture, curation, entry detail, blend

2. GRAIN/DOT GRID CONSISTENCY:
Confirm the warm dot grid background 
(background-color: #F9F7F4, radial-gradient 
dots at rgba(180,168,148,0.65), 24px spacing) 
is applied identically on every single page — 
diary, roll, capture, curation, entry detail, 
blend. No page should have a plain solid 
background or a different dot color/opacity.

3. CARD HOVER (diary + picker lists):
translateY(-2px), 200ms ease, consistent 
everywhere a card-like element appears, 
including blend picker rows (subtle background 
tint on hover, not lift, since they're list 
rows not cards)

4. ROLL — pulsing developing dot:
Confirm the amber dot on Roll cards pulses: 
opacity 1 → 0.4 → 1, 2s infinite ease-in-out

5. DEVELOP/EDIT TRANSITION:
When curation is saved (either "Develop this 
memory" in develop mode or "Save changes" in 
edit mode), the photo blur transition plays: 
blur(10px) → blur(0), 600ms ease-out, before 
navigating away

6. SWATCH HEX COPY:
On entry detail page, clicking a swatch hex 
value copies it to clipboard, shows "Copied" 
tooltip (DM Sans 400 11px white on #1A1814 
background, 4px radius, fades after 1.5s)

7. EMPTY STATES — confirm all are in place 
and styled consistently:
   - Empty diary: "Nothing here yet. Go 
     outside." + clickable camera icon + 
     "+ new color memory" link
   - Empty roll: all 12 slots shown as dashed 
     empty placeholders if nothing developing
   - Empty curation (0 swatches picked): 
     "tap anywhere on the photo to pick a 
     color" instruction visible above canvas
   - Empty blend (both slots empty): the 
     empty × empty card state with "tap 
     either card to begin"
   - Too few entries for blend (<2 developed): 
     "you need at least two memories to 
     blend" + back to diary link
   - Empty picker list (no eligible entries): 
     "no other memories to blend with"

8. RESPONSIVE CHECK:
   - Diary grid: 4 columns desktop → 2 columns 
     tablet → 1 column mobile
   - Filter chip row: wraps naturally at 
     narrow widths
   - Blend cards row: stacks vertically below 
     a certain breakpoint if needed, × 
     separator rotates or repositions 
     appropriately
   - Picker list rows: remain full width and 
     legible at mobile widths
   - Curation two-column layout (photo + 
     controls): stacks vertically on mobile, 
     photo on top, controls below

9. FOCUS STATES:
All interactive elements (buttons, cards, 
chips, swatches, list rows, inputs) have 
visible keyboard focus outlines: 1px solid 
#C4A882, 2px offset

10. NAV CONSISTENCY CHECK across all pages:
   - "tintura" wordmark top-left, always 
     navigates to /
   - Spinning reel icon + "X photos developing" 
     top-right, always navigates to /roll
   - "← back" label (not "← Diary") on every 
     page except diary home, respecting each 
     page's correct back-destination logic
   - "+ new color memory" CTA only appears 
     in the diary home nav (centered), not 
     on other pages

11. FILTER STATE PERSISTENCE CHECK:
Confirm active filters (color, location, 
blend/not blend) persist while navigating 
into an entry and back to the diary, but 
reset on a fresh page load/refresh

12. LOADING STATES:
Any async operation (k-means auto-pick, 
CIELAB blend calculation, EXIF extraction) 
shows a brief, quiet loading indicator 
consistent with the app's tone — no spinners, 
prefer a soft pulse or fade on the affected 
element

---

FINAL DEMO DATA CHECK:

Confirm the app seeds with exactly ONE sample 
diary entry on first load (localStorage empty), 
clearly deletable, demonstrating the full 
product: a real photo, a 3-5 color palette, 
a name in the established voice, location, 
and date. All other "demo" entries used during 
development (Lisbon, Big Sur, Oaxaca, Kyoto, 
etc.) should be removed from any hardcoded 
seed data — they were for design/build 
purposes only and should not ship in the 
final localStorage initialization logic.

After this pass, the app should be complete, 
internally consistent, and demoable end-to-end: 
capture → roll → curate → diary → filter → 
blend → export.