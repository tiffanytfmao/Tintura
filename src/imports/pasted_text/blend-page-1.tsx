Rebuild the /blend page with all of the following 
fixes and features. This replaces the entire 
current /blend implementation.

---

ROUTING + NAVIGATION:

1. The ⊕ blend pill on the diary home page 
   navigates directly to /blend with no query 
   params. Remove the current multi-select 
   diary mode entirely — blend is only accessed 
   via /blend.

2. URL param handling on /blend:
   - /blend — empty state, both cards empty
   - /blend?anchor=:id — left card pre-filled 
     with that entry, right card empty, 
     picker opens immediately for right slot
   - /blend?returnTo=:path — on cancel or 
     after save, navigate to returnTo path 
     instead of /
   
   When arriving from /entry/:id via the 
   "Blend with another memory" button, 
   the link should be:
   /blend?anchor=:id&returnTo=/entry/:id

3. Cancel button behavior:
   Always navigates to returnTo param if present,
   otherwise navigates to /
   Cancel is visible in STATE 2 context bar 
   and STATE 3 (as a quiet text link below 
   the save button: "cancel — discard blend")

---

STATE MANAGEMENT:

The page tracks two independent slots:
  leftEntry: null | entry object
  rightEntry: null | entry object

These are completely independent — either 
can be filled or cleared without affecting 
the other.

STATE 1 (both null): empty × empty view
STATE 2 (one filled, one null): 
  whichever slot was tapped last opens 
  the full-page picker
STATE 3 (both filled): blend result visible

---

STATE 1 — EMPTY × EMPTY:

Centered on page, max-width 520px, 
margin: 0 auto, padding-top: 40px.

Page header:
  "blend two memories"
  Cormorant Garamond 300 italic 32px #1A1814
  margin-bottom: 4px
  
  "merge two palettes into one"
  DM Sans 400 12px #8C8880
  margin-bottom: 32px

Two cards side by side, gap: 16px,
align-items: stretch.

EMPTY CARD component (used for both slots):
  min-height: 240px
  flex: 1
  border: 1.5px dashed #C4A882
  border-radius: 4px
  background: rgba(196,168,130,0.04)
  display: flex, flex-direction column
  align-items center, justify-content center
  gap: 10px
  cursor: pointer
  transition: background 150ms, 
              border-color 150ms

  On hover:
    background: rgba(196,168,130,0.09)
    border-color: #1A1814

  Contents:
    + icon: font-size 32px, color #C4A882,
    font-weight 300, line-height 1
    
    "pick a memory"
    DM Sans 500 12px #C4A882

  On click: opens full-page picker for 
  that slot (left or right)

× SEPARATOR:
  Cormorant Garamond 300 italic 32px #C4A882
  align-self: center
  padding: 0 12px
  flex-shrink: 0
  margin-bottom: 48px

Below cards row, centered:
  "tap either card to begin"
  DM Sans 400 11px italic #8C8880
  margin-top: 20px

ACCESSIBILITY:
Both empty cards have strong enough contrast:
  border #C4A882 on rgba(196,168,130,0.04) 
  background — ensure border is 1.5px minimum
  Text #C4A882 on near-white — acceptable
  The + icon at 32px reads clearly at this size

---

FULL-PAGE PICKER:

Triggered when either empty card is tapped.
Tracks which slot is being filled: 
  activeSlot: "left" | "right"

CONTEXT BAR (56px tall, full width):
  Background: white
  Border-bottom: 1px solid #E8E4DC
  Display: flex, align-items center
  Padding: 0 32px, gap: 16px

  If the OTHER slot is already filled,
  show its mini summary:
    36×36px photo thumbnail, border-radius 3px
    object-fit cover
    Beside it:
      Entry anchor DM Sans 500 9px uppercase
      Entry name Cormorant Garamond 300 12px
      #8C8880, max-width 260px, overflow ellipsis
    Then: × separator Cormorant italic 20px 
    #C4A882, padding 0 8px
    Then: "selecting [left/right] memory..."
    DM Sans 400 11px italic #C4A882

  If the OTHER slot is empty:
    Show: "picking memory [1/2]..."
    DM Sans 400 11px italic #C4A882
    (1 for left slot, 2 for right slot)

  Far right: "cancel" 
    DM Sans 400 12px #8C8880
    margin-left: auto, cursor pointer
    Navigates to returnTo or /

PICKER LIST:

  Header:
    Padding: 12px 32px 10px
    Border-bottom: 1px solid #E8E4DC
    "select a memory"
    DM Sans 500 11px uppercase #8C8880
    letter-spacing: 0.1em

  Rows — read all entries from 
  localStorage["tintura_diary"] where:
    entry.state === "developed"
    entry.isBlend !== true
    entry.id !== leftEntry?.id
    entry.id !== rightEntry?.id
    (excludes both already-selected entries
    and all blend entries)

  EMPTY PICKER STATE:
    If no entries qualify after filtering:
    Centered message:
      "no other memories to blend with"
      Cormorant Garamond 300 italic 18px #8C8880
      margin-top: 40px

  TOO FEW ENTRIES STATE:
    On page load, before any picker opens,
    check total developed non-blend entries.
    If count < 2:
      Hide both empty cards and × separator.
      Show centered message:
        "you need at least two memories 
        to blend"
        Cormorant Garamond 300 italic 20px 
        #8C8880, margin-top: 40px
      Below it:
        "← back to diary"
        DM Sans 400 13px #C4A882
        cursor pointer, navigates to /

  Each picker row:
    Height: auto, min-height: 60px
    Padding: 12px 32px
    Display: flex, align-items center
    Gap: 16px
    Border-bottom: 1px solid #E8E4DC
    Cursor: pointer
    Transition: background 150ms

    On hover: background rgba(196,168,130,0.06)

    Contents:
    - Photo thumbnail: 44×44px, border-radius 3px
      object-fit cover, flex-shrink 0
    - Info (flex:1, min-width 0):
        Anchor: DM Sans 500 10px uppercase
        #1A1814, letter-spacing 0.06em
        display block, margin-bottom 2px
        Name: Cormorant Garamond 300 15px
        #1A1814, white-space nowrap,
        overflow hidden, text-overflow ellipsis
        Meta: DM Mono 10px #8C8880, margin-top 2px
        format: "LOCATION · DATE"
    - Palette dots (flex-shrink 0):
        One circle per swatch, 10px diameter,
        border-radius 50%, gap 4px

    On click: 
      Sets that entry to the active slot
      (leftEntry or rightEntry based on 
      activeSlot value)
      Returns to STATE 1 or STATE 3 
      (if both slots now filled)

---

STATE 3 — BOTH SELECTED:

Layout: single column, centered, 
max-width: 560px, margin: 0 auto,
padding: 32px 32px 48px.

Page header: same as STATE 1.

TWO FILLED CARDS ROW:
  Display: flex, gap: 16px, 
  align-items: stretch
  margin-bottom: 24px

FILLED CARD component:
  flex: 1
  background: white
  border: 1px solid #E8E4DC
  border-radius: 4px
  overflow: visible
  position: relative

  Photo area: height 160px, position relative,
  overflow hidden, border-radius 4px 4px 0 0
  img: object-fit cover, width 100%, height 100%

  Vertical palette strip: position absolute,
  left 0, top 0, bottom 0, width 44px,
  display flex, flex-direction column,
  border-radius 4px 0 0 0
  Each segment: flex 1, background = swatch color
  Last segment: border-radius 0 0 0 4px

  Below photo: horizontal strip, 9px tall,
  display flex, equal segments per swatch

  Card body: padding 10px 12px
    Anchor: DM Sans 500 9px uppercase #1A1814
    Name: Cormorant Garamond 300 12px #1A1814
    line-height 1.3, 2 lines max

  DELETE × button:
    position absolute, top -8px, right -8px
    width 20px, height 20px
    border-radius 50%
    background #1A1814, color #F9F7F4
    font-size 10px, font-family DM Sans 500
    display flex, align-items center, 
    justify-content center
    cursor pointer, z-index 2

    On click:
      Clears that slot (left or right)
      independently — does NOT clear the 
      other slot
      Returns to STATE 2 with other slot 
      still filled, picker opens for 
      the cleared slot

× SEPARATOR: same as STATE 1.

---

BLEND RESULT SECTION:

Run the CIELAB blend algorithm (from previous 
spec) immediately when both slots are filled.
Store result as blendPalette state array.
This is the DEFAULT palette shown.

Container:
  background: white
  border: 1px solid #E8E4DC
  border-radius: 4px
  padding: 20px
  margin-top: 0

Section label:
  "blend result"
  DM Sans 500 10px uppercase #8C8880
  letter-spacing 0.1em, margin-bottom 14px

BLEND PALETTE (editable):

Track blendPalette as state array of hex strings.
Initially set by the CIELAB algorithm output.
User can modify by removing or adding colors.

Display as 5 slots (filled + empty):
  display: flex, gap: 6px, 
  align-items: flex-start

  FILLED SLOT:
    Flex-direction column, align-items center,
    flex: 1, position relative
    
    Swatch div: width 100%, height 48px,
    border-radius 3px
    background = color value
    position relative

    Remove × button:
      position absolute, top -6px, right -6px
      width 16px, height 16px
      border-radius 50%
      font-size 9px
      display flex, align-items center,
      justify-content center
      cursor pointer

      ACTIVE (blendPalette.length > 1):
        background #1A1814, color #F9F7F4

      DISABLED (blendPalette.length === 1):
        background #E8E4DC, color #8C8880
        cursor not-allowed
        title: "blend needs at least one color"

    On × click (when active):
      Remove that color from blendPalette array

    Hex label: DM Mono 9px #8C8880,
    text-align center, margin-top 4px

  EMPTY SLOT (shown for remaining 5 - 
  blendPalette.length slots):
    flex: 1
    height 48px, border-radius 3px
    
    If blendPalette.length < 5:
      border: 1px dashed #C4A882
      background transparent
      display flex, align-items center,
      justify-content center
      + icon: font-size 20px, color #C4A882
      (these slots become filled when user 
      taps a source swatch)
    
    If blendPalette.length === 5:
      Hide empty slots entirely — 
      no empty slots shown when full

SOURCE PALETTES:

Divider: 1px solid #E8E4DC, margin 16px 0

For each entry (leftEntry, rightEntry),
show a source palette row:

  Row label:
    Display flex, align-items center, gap 6px
    margin-bottom: 8px
    
    Color dot: 8px circle, background = 
    entry.swatches[0] color
    
    Label text: entry note split at first "."
    take everything before it, lowercase
    DM Sans 500 10px uppercase #8C8880
    letter-spacing 0.08em

  Source swatches:
    Display flex, gap 5px

    Each source swatch:
      width 36px, height 36px
      border-radius 3px
      background = swatch color
      position relative
      transition: transform 150ms, opacity 150ms
      cursor pointer

      USED STATE (color already in blendPalette,
      checked by exact hex match):
        opacity: 0.25
        cursor not-allowed
        No hover effect

      AVAILABLE STATE:
        On hover: transform scale(1.08)
        Show + icon overlay:
          position absolute, inset 0
          border-radius 3px
          background rgba(255,255,255,0.15)
          display flex, align-items center,
          justify-content center
          SVG + icon, white, 12×12px

        On click (only if blendPalette.length < 5
        and color not already in blendPalette):
          Add color to blendPalette array

        On click when blendPalette.length === 5:
          Show brief shake animation on the 
          result swatch row — no color added

---

NAME FIELD:

Auto-populate on STATE 3 entry:
  "[left anchor] × [right anchor]"
  Where anchor = entry.note.split('.')[0].trim()

Input:
  Cormorant Garamond 300 20px #1A1814
  border none, border-bottom 1px solid #C4A882
  width 100%, padding-bottom 6px
  background transparent, outline none
  margin: 16px 0 4px

Helper:
  "edit the name — it's your memory"
  DM Sans 400 10px italic #8C8880

---

SAVE BUTTON:

  width 100%, padding 13px
  background #1A1814, color #F9F7F4
  font DM Sans 500 14px
  border-radius 4px, border none
  margin-top 16px
  label: "Save blend"

  Disabled if blendPalette.length === 0
  (should never happen but guard it)

  On click:
    const newEntry = {
      id: crypto.randomUUID(),
      state: "developed",
      photo: null,
      note: nameField.value,
      swatches: blendPalette,
      timestamp: new Date().toISOString(),
      location: leftEntry.location,
      isBlend: true,
      blendSources: [leftEntry.id, rightEntry.id],
      blendPhotos: [leftEntry.photo, rightEntry.photo]
    }
    
    Read existing array from 
    localStorage["tintura_diary"], push newEntry,
    write back.
    
    Navigate to returnTo param if present, 
    otherwise navigate to /

Cancel link below save button:
  "cancel — discard blend"
  DM Sans 400 11px #8C8880
  text-align center, margin-top 10px
  cursor pointer, display block
  On click: navigate to returnTo or /

---

SAME-ENTRY GUARD:

The picker list always excludes:
  entry.id === leftEntry?.id
  entry.id === rightEntry?.id
  entry.isBlend === true

This makes it impossible to select the same 
entry twice. No additional error message needed.

---

Do not change any other page or component.