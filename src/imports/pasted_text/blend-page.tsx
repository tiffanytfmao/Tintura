Completely rebuild the /blend page from scratch.
Do not change any other page.

OVERVIEW:
The blend page has three states that the user 
moves through sequentially:
  STATE 1: Empty — both cards empty
  STATE 2: One selected — left card filled, 
           right card empty, full-page picker active
  STATE 3: Both selected — both cards filled, 
           blend result visible

PERSISTENT ELEMENTS (all states):
Nav: same as every other page.
  "tintura" wordmark left, navigates to /
  "← diary" back link below nav left
  Reel icon + "X photos developing" top right

Page header (below nav, above card area):
  Title: "blend two memories"
  Cormorant Garamond 300 italic 32px #1A1814
  margin-bottom: 4px
  
  Subtitle: "merge two palettes into one"
  DM Sans 400 12px #8C8880
  margin-bottom: 28px

---

STATE 1 — EMPTY × EMPTY:

Two cards side by side, centered on page,
max-width 480px total, margin: 0 auto.
Each card: flex:1, min-height: 220px.

LEFT CARD (empty):
  border: 1px dashed #C4A882
  border-radius: 4px
  background: transparent
  display: flex, flex-direction column,
  align-items center, justify-content center
  gap: 8px
  cursor: pointer
  
  Contents:
  A large + : font-size 28px, color #C4A882, 
  font-weight 300, line-height 1
  
  Label: "pick a memory"
  DM Sans 400 11px #C4A882
  
  On hover: background rgba(196,168,130,0.05)
  
  On click: transitions to STATE 2

× SEPARATOR:
  Font: Cormorant Garamond 300 italic 28px #C4A882
  padding: 0 12px
  align-self: center
  margin-bottom: 40px

RIGHT CARD (empty, same as left but dimmed):
  Same styling as left empty card BUT:
  opacity: 0.4
  cursor: not-allowed
  pointer-events: none
  (Right card is not tappable until left is filled)
  
  Label: "pick a memory"

Below both cards, centered:
  "tap a card to begin"
  DM Sans 400 11px italic #8C8880
  margin-top: 16px

---

STATE 2 — FULL PAGE PICKER:

When left empty card is tapped, the page 
transitions to full-page picker mode.

CONTEXT BAR (replaces the two-card area):
  Height: 56px
  Background: white
  Border-bottom: 1px solid #E8E4DC
  Display: flex, align-items center
  Padding: 0 32px
  Gap: 12px

  Left: the filled card shown as a mini summary:
    36×36px photo thumbnail (border-radius 3px,
    object-fit cover, shows entry photo)
    Beside it:
      Entry anchor in DM Sans 500 9px uppercase
      #1A1814 letter-spacing 0.06em
      Entry name in Cormorant Garamond 300 12px
      #8C8880, single line, overflow ellipsis,
      max-width: 300px

  Center: × separator
    Cormorant Garamond 300 italic 20px #C4A882

  Right: empty slot indicator
    "selecting second memory..."
    DM Sans 400 11px italic #C4A882

  Far right: "cancel" text link
    DM Sans 400 12px #8C8880
    margin-left: auto
    On click: returns to STATE 1

PICKER LIST (fills remaining page height):

  Header:
    Padding: 10px 32px 8px
    Border-bottom: 1px solid #E8E4DC
    "select a memory to blend with"
    DM Sans 500 10px uppercase #8C8880 
    letter-spacing 0.1em

  List rows (one per developed diary entry,
  excluding the currently selected left card,
  excluding existing blend entries):
  
    Each row:
    Height: 56px
    Padding: 0 32px
    Display: flex, align-items center, gap 14px
    Border-bottom: 1px solid #E8E4DC
    Cursor: pointer
    Transition: background 150ms
    
    On hover: background rgba(196,168,130,0.06)
    
    Contents left to right:
    - Photo thumbnail: 40×40px, border-radius 3px,
      object-fit cover, shows entry.photo
    - Info (flex:1, min-width 0):
        Entry anchor: DM Sans 500 9px uppercase
        #1A1814 letter-spacing 0.06em, display block
        Entry name: Cormorant Garamond 300 14px
        #1A1814, single line, overflow ellipsis
        Meta: DM Mono 10px #8C8880, 
        "LOCATION · DATE"
    - Palette dots: row of filled circles
        Each dot: 10px diameter, border-radius 50%
        One dot per swatch color in entry.swatches
        Gap: 4px

  On row click: that entry becomes the right card.
  Page transitions to STATE 3.

---

STATE 3 — BOTH SELECTED + BLEND RESULT:

Layout: single column, centered, max-width 560px,
padding: 0 32px.

TWO CARDS ROW:
Same as STATE 1 layout but both cards filled.
Each filled card: flex:1

FILLED CARD component:
  background: white
  border: 1px solid #E8E4DC
  border-radius: 4px
  overflow: visible (for the × delete button)
  position: relative

  Photo area: height 160px, position relative,
  overflow hidden, border-radius 4px 4px 0 0
  Shows entry.photo as object-fit cover img

  Vertical palette strip on LEFT edge of photo:
  position absolute, left 0, top 0, bottom 0,
  width 44px, display flex, flex-direction column
  Each swatch: flex 1, background = swatch color
  Inherits border-radius top-left and bottom-left

  Below photo: palette strip full width, 9px tall,
  display flex — equal segments per swatch color

  Card body: padding 9px 12px
    Anchor: DM Sans 500 9px uppercase #1A1814
    Name: Cormorant Garamond 300 12px #1A1814
    line-height 1.3

  DELETE × button:
  position: absolute
  top: -8px, right: -8px
  width: 20px, height: 20px
  border-radius: 50%
  background: #1A1814
  color: #F9F7F4
  font-size: 11px
  font-family: DM Sans 500
  display: flex, align-items center, 
  justify-content center
  cursor: pointer
  z-index: 2
  
  On click: that card returns to empty state.
  If left card deleted: return to STATE 1.
  If right card deleted: return to STATE 2
  (left card stays filled, picker reopens).

× SEPARATOR: same as STATE 1.

---

BLEND RESULT SECTION:
Appears below the two cards in STATE 3.
Margin-top: 24px.

Container:
  background: white
  border: 1px solid #E8E4DC
  border-radius: 4px
  padding: 20px

Section label:
  "blend result"
  DM Sans 500 10px uppercase #8C8880
  letter-spacing 0.1em
  margin-bottom: 14px

BLEND PALETTE ALGORITHM:
Implement this exactly in JavaScript:

1. Collect all swatches from both entries:
   const allColors = [...entry1.swatches, 
                      ...entry2.swatches]
   Each swatch is a hex string e.g. "#E8432E"

2. Convert each hex to CIELAB using this 
   conversion chain: hex → RGB → linear RGB 
   → XYZ (D65) → CIELAB.
   
   RGB to linear: 
   val = val/255
   linear = val <= 0.04045 
     ? val/12.92 
     : Math.pow((val+0.055)/1.055, 2.4)
   
   Linear RGB to XYZ (D65 matrix):
   X = r*0.4124 + g*0.3576 + b*0.1805
   Y = r*0.2126 + g*0.7152 + b*0.0722
   Z = r*0.0193 + g*0.1192 + b*0.9505
   
   XYZ to LAB (D65 white: Xn=0.95047, 
   Yn=1.0, Zn=1.08883):
   f(t) = t > 0.008856 
     ? Math.cbrt(t) 
     : (7.787*t) + (16/116)
   L = 116 * f(Y/Yn) - 16
   a = 500 * (f(X/Xn) - f(Y/Yn))
   b = 200 * (f(Y/Yn) - f(Z/Zn))

3. Guarantee at least 1 color from each entry:
   selected = [entry1.swatches[0], 
               entry2.swatches[0]]

4. Greedily add colors to maximize minimum 
   perceptual distance (delta-E in CIELAB):
   While selected.length < 5 and 
   unselected colors remain:
     For each unselected color, compute
     minimum delta-E to all selected colors:
     deltaE = Math.sqrt(
       (L1-L2)² + (a1-a2)² + (b1-b2)²
     )
     Add the color with the highest 
     minimum delta-E to selected.
     Skip if its minimum delta-E to any 
     selected color is < 25 (too similar).

5. Sort final palette by L* value ascending
   (lightest to darkest).

6. Display as swatch row:
   Each swatch: flex 1, height 40px, 
   border-radius 3px, gap 6px
   Hex value below in DM Mono 9px #8C8880
   centered, margin-top 3px

NAME FIELD:
Auto-populate with:
"[entry1 anchor] × [entry2 anchor]"
Where anchor = text before first "." in 
entry.note string, trimmed.
Example: "6am Tokyo × morning Kyoto"

Input styling:
  Cormorant Garamond 300 20px #1A1814
  border: none
  border-bottom: 1px solid #C4A882
  width: 100%
  padding-bottom: 6px
  background: transparent
  outline: none
  margin: 14px 0 4px

Helper text:
  "edit the name — it's your memory"
  DM Sans 400 10px italic #8C8880

SAVE BUTTON:
  Margin-top: 16px
  Width: 100%
  Background: #1A1814
  Color: #F9F7F4
  Font: DM Sans 500 14px
  Border-radius: 4px
  Padding: 13px
  Border: none
  Label: "Save blend"
  Cursor: pointer

  On click: create new localStorage entry:
  {
    id: crypto.randomUUID(),
    state: "developed",
    photo: null,
    note: [name field value],
    swatches: [blend palette array],
    timestamp: new Date().toISOString(),
    location: entry1.location,
    isBlend: true,
    blendSources: [entry1.id, entry2.id],
    blendPhotos: [entry1.photo, entry2.photo]
  }
  
  Save to localStorage["tintura_diary"].
  Navigate to / (diary home).

---

BLEND CARD IN DIARY:

When rendering a diary card where isBlend: true,
use this special photo treatment instead of 
a single photo:

Split the photo area vertically 50/50:
  Left half: entry1 photo (blendSources[0])
    background: url(blendPhotos[0])
    background-size: cover
    background-position: center
    width: 50%, height: 100%
    
  Right half: entry2 photo (blendSources[1])
    same treatment
    border-left: 1px solid rgba(255,255,255,0.3)

The palette strip below the photo shows the 
merged palette (entry.swatches), not source 
palettes. Same treatment as regular cards.

The vertical palette strip on the left edge 
shows the merged palette. Same as regular cards.

No special icon or mark on blend cards —
they look like regular diary entries except 
for the split photo.

In the entry detail view for a blend entry,
below the date/location metadata, add:
  "blended from" label: 
  DM Sans 500 10px uppercase #8C8880
  Below it: both source entry names in
  Cormorant Garamond 300 13px #8C8880 italic,
  separated by " × "

Do not change any other page or feature.