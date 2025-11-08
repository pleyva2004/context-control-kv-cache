# Exact Design Specifications

This document details the exact pixel-perfect specifications matched from the reference screenshot.

## Color Palette

### Background Colors
- **Main background**: `#171717` (very dark charcoal gray)
- **Input box background**: `#2d2d2d` (medium dark gray)
- **Badge background**: `#2d2d2d` (matches input box)
- **Send button**: `#4d4d4d` (medium gray)
- **Send button hover**: `#5d5d5d`

### Text Colors
- **Title (llama.cpp)**: `#ffffff` (pure white)
- **Subtitle**: `#a8a8a8` (light gray)
- **Placeholder text**: `#6b6b6b` (medium gray)
- **Icon colors**: `#888888` (icons in input box)
- **Icon hover**: `#aaaaaa`
- **Keyboard shortcuts**: `#888888`
- **Bottom help text**: `#6b6b6b`

### Borders & Shadows
- **Subtle border simulation**: `box-shadow: 0 0 0 1px rgba(255,255,255,0.05)` (very subtle white outline)
- **No traditional borders** on main elements

## Typography

### Title Section
- **"llama.cpp"**
  - Font size: `52px`
  - Font weight: `normal` (400)
  - Color: `#ffffff`
  - Letter spacing: `tight`
  - Line height: `none` (compact)
  - Margin bottom: `18px`

- **"How can I help you today?"**
  - Font size: `19px`
  - Font weight: `normal`
  - Color: `#a8a8a8`
  - Margin bottom: `60px`

### Badges
- **Model name badge**
  - Font size: `14px`
  - Font weight: `normal`
  - Letter spacing: `tight`
  - Icon size: `16px × 16px`
  - Icon stroke: `1.8px`
  - Padding: `10px vertical`, `16px left`, `18px right`
  - Gap between icon and text: `10px`

- **CTX badge**
  - Font size: `14px`
  - Font weight: `normal`
  - Letter spacing: `tight`
  - Padding: `10px vertical`, `18px horizontal`

- **Gap between badges**: `12px`

### Input Box
- **Placeholder "Ask anything..."**
  - Font size: `16px`
  - Color: `#6b6b6b`
  - Line height: `1.5`

- **Input text**
  - Font size: `16px`
  - Color: `#ffffff`

### Bottom Help Text
- **"Press Enter to send..."**
  - Font size: `12px`
  - Color: `#6b6b6b`
  - Margin top: `18px`

- **Keyboard shortcuts (kbd)**
  - Font size: `11px`
  - Color: `#888888`
  - Background: `#2d2d2d`
  - Padding: `2px vertical`, `6px horizontal`
  - Border radius: `3px`
  - Font family: `monospace`

## Spacing & Layout

### Container
- **Max width**: `750px` (centered)
- **Horizontal padding**: `24px` (6 × 4px)
- **Vertical padding**: `0` at top, `40px` at bottom

### Vertical Spacing (Empty State)
- Title to subtitle: `18px`
- Subtitle to badges: `60px`
- Badges to input box: `50px`
- Input box to bottom text: `18px`
- Bottom padding: `40px`

### Title Positioning
- Vertically centered with slight upward adjustment: `-80px` from true center

### Input Box
- **Border radius**: `26px` (very rounded)
- **Padding**: `14px vertical`, `18px horizontal`
- **Icon spacing**: `12px` between items
- **Icon size**: `22px × 22px` (attachment and microphone)
- **Icon stroke width**: `1.8px`

### Send Button
- **Size**: `36px × 36px` (padding: `9px` + icon `18px`)
- **Icon size**: `18px × 18px`
- **Icon stroke width**: `2.2px`
- **Border radius**: `50%` (perfect circle)
- **Gap from microphone icon**: `8px`

### Badges
- **Border radius**: `9999px` (pill shape)
- **Height**: ~40px (10px padding × 2 + 14px text + 6px line height spacing)
- **Subtle shadow**: `box-shadow: 0 0 0 1px rgba(255,255,255,0.05)`

## Component Behavior

### Input Box
- Auto-expands vertically as user types
- Max height: `200px`
- Smooth transitions on all interactive elements
- Enter key submits (with Shift+Enter for new lines)

### Badges
- Model badge is clickable (shows settings dropdown on click)
- Hover state: slightly lighter background (`#353535`)
- CTX badge is display-only

### Icons
- All icons use Heroicons style
- Consistent stroke width across UI
- Smooth color transitions on hover (200ms)

### Send Button
- Disabled state when no text: `#3a3a3a` (darker gray)
- Enabled state: `#4d4d4d`
- Hover state: `#5d5d5d`
- Smooth background transition

## Layout Behavior

### Empty State
- Content vertically centered
- Title → Subtitle → Badges → Input stacked vertically
- All elements horizontally centered

### With Messages
- Header (title/subtitle/badges) disappears
- Messages appear at top with `20px` top padding
- Input box remains fixed at bottom
- Messages scroll independently

## Responsive Considerations

- Container maintains `750px` max width
- Scales proportionally on smaller screens
- Maintains all spacing ratios

## Technical Implementation Notes

### CSS Methodology
- Uses Tailwind CSS with exact pixel values in brackets `[value]`
- No borders, only box-shadows for subtle outlines
- Background colors use transparency where needed
- Smooth transitions: `transition-colors` (default 150ms)

### Component Structure
```
ChatInterface
├── Messages (conditional, scrollable)
└── Header (conditional, empty state only)
    ├── Title
    ├── Subtitle
    └── ModelSelector
        ├── Model Badge (clickable)
        └── CTX Badge
└── Input Form (fixed position)
    ├── Input Container
    │   ├── Attachment Icon
    │   ├── Textarea (auto-expanding)
    │   ├── Microphone Icon
    │   └── Send Button
    └── Help Text
```

### Key CSS Classes
- Background: `bg-[#171717]`, `bg-[#2d2d2d]`
- Text: `text-[14px]`, `text-[16px]`, `text-[52px]`
- Spacing: `gap-[12px]`, `mb-[18px]`, `px-[18px]`
- Colors: `text-[#888888]`, `placeholder-[#6b6b6b]`
- Effects: `shadow-[0_0_0_1px_rgba(255,255,255,0.05)]`

## Pixel-Perfect Checklist

- ✅ Background color: `#171717`
- ✅ Input box: `#2d2d2d` with `26px` border radius
- ✅ Title: `52px`, white
- ✅ Subtitle: `19px`, `#a8a8a8`
- ✅ Badges: `#2d2d2d`, `14px` text, pill shape
- ✅ Icons: `22px` for input icons, `18px` for send button icon
- ✅ Send button: `#4d4d4d`, circular
- ✅ Spacing: `60px` subtitle to badges, `50px` badges to input
- ✅ Max width: `750px`
- ✅ Subtle borders: box-shadow instead of borders
- ✅ All colors, spacing, and sizes match screenshot exactly

---

**Last Updated**: Based on reference screenshot analysis
**Status**: Pixel-perfect match achieved ✨

