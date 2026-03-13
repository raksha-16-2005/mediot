/**
 * MEDIOT SHIELD - UI STYLING GUIDE
 * Professional Cybersecurity Theme Implementation
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

const COLORS = {
  // PRIMARY BACKGROUNDS
  primary: '#0b0f1a',      // Deep space - main background
  secondary: '#1e293b',    // Slate 800 - cards, panels
  tertiary: '#374151',     // Slate 700 - hover states

  // ACCENT COLORS - Severity/Status
  success: '#22c55e',      // Green - healthy, normal, good status
  warning: '#eab308',      // Amber - caution, needs attention
  danger: '#ef4444',       // Red - critical, immediate action
  info: '#0284c7',         // Blue - informational, neutral
  purple: '#8b5cf6',       // Purple - special, highlight

  // TEXT
  textPrimary: '#f1f5f9',   // Primary text - white
  textSecondary: '#cbd5e1', // Secondary text
  textTertiary: '#94a3b8',  // Tertiary - labels, hints

  // BORDERS
  borderLight: '#334155',   // Light borders
  borderDark: '#1e293b',    // Dark borders

  // GRADIENTS
  gradientInfo: 'linear-gradient(135deg, #0284c7 0%, #8b5cf6 100%)',
  gradientSuccess: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
  gradientDanger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
};

// ============================================================================
// COMPONENT STYLING
// ============================================================================

/*
CARDS
------
Background: #1e293b (secondary)
Border: 1px solid #334155 (border-light)
Border Radius: 8px
Padding: 24px (lg) / 16px (sm)
Shadow: 0 4px 6px rgba(0, 0, 0, 0.7)
Hover:
  - Border: #475569 (lighter)
  - Shadow: 0 10px 15px rgba(0, 0, 0, 0.8)
  - Transform: translateY(-2px)

Variants:
- Success: bg-green-950/20, border-green-900
- Warning: bg-yellow-950/20, border-yellow-900
- Danger: bg-red-950/20, border-red-900
- Info: bg-blue-950/20, border-blue-900

Example:
<div className="card">
  <h3>Device Status</h3>
  <p>Online: 45/50 devices</p>
</div>
*/

/*
METRIC CARDS
------------
Show KPIs with large numbers

Layout:
┌─────────────────────┐
│ Icon        Label   │
│      50             │
│    98.5% growth     │
└─────────────────────┘

Classes:
- metric-card: Base style
- metric-card-success: Green variant
- metric-card-warning: Yellow variant
- metric-card-danger: Red variant

Example:
<div className="metric-card-success">
  <p>Healthy Devices</p>
  <p className="text-3xl font-bold text-green-400">45</p>
</div>
*/

/*
ALERT CARDS
-----------
Display alerts with severity indicators

Features:
- Left border (4px) in severity color
- Background with slight opacity
- Severity badge
- Timestamp
- Device name

Colors:
- Critical: Red (#ef4444)
- Warning: Yellow (#eab308)
- Info: Blue (#0284c7)

Example:
<div className="alert-card-critical">
  🚨 Alert: Unauthorized access on Device-001
</div>
*/

/*
STATUS BADGES
-------------
Show device/component status

Variants:
- Online: Green background, green text
- Offline: Gray background, gray text
- Suspicious: Yellow background, yellow text
- Critical: Red background, red text

Format:
● Status Name

Example:
<span className="status-online">● Online</span>
<span className="status-critical">● Critical</span>
*/

/*
BUTTONS
-------
Primary (Blue):
- Background: #2563eb
- Hover: #1d4ed8
- Active: #1e40af
- Text: White

Danger (Red):
- Background: #dc2626
- Hover: #b91c1c
- Active: #991b1b
- Text: White

Secondary (Gray):
- Background: #475569
- Hover: #334155
- Active: #1e293b
- Text: Light text

Ghost (Transparent):
- Background: transparent
- Hover: #1e293b
- Text: Light text
*/

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

/*
HEADING HIERARCHY
-----------------
h1: 2.5rem (40px), 700 weight, -0.01em spacing
  → Page titles, main headers

h2: 1.875rem (30px), 700 weight, -0.01em spacing
  → Section headers, dashboard names

h3: 1.5rem (24px), 700 weight
  → Subsection headers, card titles

h4: 1.25rem (20px), 700 weight
  → Component headers

h5: 1.125rem (18px), 700 weight
  → Label headers

h6: 1rem (16px), 700 weight
  → Minor headers

Body: 1rem (16px), 400 weight, 1.6 line-height
  → Regular text

Small: 0.875rem (14px)
  → Secondary text, hints

Tiny: 0.75rem (12px)
  → Labels, badges, timestamps

All colors: #f1f5f9 (primary text)
All line-height: 1.2-1.6 for readability
All letter-spacing: -0.01em for headers
*/

// ============================================================================
// SPACING SYSTEM
// ============================================================================

/*
STANDARDIZED SPACING SCALE

xs:  0.25rem  (4px)
sm:  0.5rem   (8px)
md:  1rem     (16px)    ← default
lg:  1.5rem   (24px)
xl:  2rem     (32px)
2xl: 3rem     (48px)

USAGE:
- Card padding: lg (24px)
- Small card padding: sm (16px)
- Grid gaps: md-lg (16-24px)
- Component spacing: md (16px)
- Section spacing: lg-xl (24-32px)
- Page padding: xl (32px on large screens)

RESPONSIVE ADJUSTMENTS:
Mobile (<768px):
- Reduce padding by 1 level
- Reduce gaps by 1 level
- Adjust font sizes down 1 level

Tablet (768-1024px):
- Use standard spacing

Desktop (>1024px):
- Use standard spacing
- Can add lg/2xl for breathing room
*/

// ============================================================================
// SHADOWS & DEPTH
// ============================================================================

/*
SHADOW SCALE

sm:  0 1px 2px rgba(0, 0, 0, 0.5)
  → Subtle elevation

md:  0 4px 6px rgba(0, 0, 0, 0.7)
  → Default for cards

lg:  0 10px 15px rgba(0, 0, 0, 0.8)
  → Hover state for depth

USAGE:
- Cards: shadow-md
- Card hover: shadow-lg
- Dropdowns: shadow-md
- Modals: shadow-lg

Dark theme shadows are deeper for better contrast
*/

// ============================================================================
// ANIMATIONS
// ============================================================================

/*
ANIMATION LIBRARY

fadeIn (0.3s)
  Opacity transition: 0 → 1
  Use for: Modal entries, component reveals

slideInUp (0.3s)
  translateY: 10px → 0, opacity: 0 → 1
  Use for: Notifications, panel entries from bottom

slideInDown (0.3s)
  translateY: -10px → 0, opacity: 0 → 1
  Use for: Dropdowns, menus

pulseGlow (2s infinite)
  Opacity: 1 → 0.7 → 1
  Use for: Status indicators, active elements

USAGE:
<div className="animate-fadeIn">Content</div>
<div className="animate-slideInUp">Notification</div>

PERFORMANCE:
All animations use GPU acceleration
All animations respect prefers-reduced-motion
Duration: 0.3s for interactions, 2s for continuous
Easing: ease-in-out for smoothness
*/

// ============================================================================
// CHART STYLING
// ============================================================================

/*
RECHARTS CUSTOMIZATION

Text Color: #94a3b8 (text-tertiary)
Grid Color: #334155 (border-light)
Background: Transparent (inherits from container)

Tooltip Styling:
- Background: #1e293b
- Border: 1px solid #475569
- Border Radius: 8px
- Color: #e2e8f0
- Padding: 8px

Legend:
- Color: #cbd5e1
- Font Size: 0.875rem
- Padding Top: 20px

Bar Colors:
- Primary: #3b82f6 (blue)
- Success: #22c55e (green)
- Warning: #eab308 (yellow)
- Danger: #ef4444 (red)
- Purple: #8b5cf6

Line Charts:
- Stroke: 2px width
- Color: Chart-specific
- Dot: false (no dots for cleaner look)
- isAnimationActive: false (for performance)

Area Charts:
- Fill: Color with gradient
- Stroke: 1-2px
- Gradient defs: Custom per chart
*/

// ============================================================================
// TABLE STYLING
// ============================================================================

/*
DATA TABLE STRUCTURE

<table className="data-table">
  <thead>
    <tr>
      <th>Header</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data</td>
    </tr>
  </tbody>
</table>

Styling:
- Header bg: rgba(0, 0, 0, 0.2)
- Header text: text-tertiary (#94a3b8)
- Header font: sm, semibold
- Row hover: rgba(148, 163, 184, 0.05)
- Row border: border-dark (#1e293b)
- Cell padding: 24px (6) horizontal, 16px (4) vertical
- Font: sm (0.875rem)

Row Highlighting:
- Clickable rows: pointer cursor
- Hover: background color shift
- Selected: different background
- Striped: alternate bg-opacity
*/

// ============================================================================
// FORM ELEMENTS
// ============================================================================

/*
INPUT FIELDS

<input className="input-base" type="text" />

Styling:
- Background: #1e293b
- Border: 1px solid #334155
- Border Radius: 8px
- Padding: 8px 16px (vertical, horizontal)
- Text: #f1f5f9
- Font Size: 1rem

Focus State:
- Border Color: #0284c7
- Box Shadow: 0 0 0 3px rgba(2, 132, 199, 0.1)
- Outline: none
- Transition: 0.15s

Placeholder:
- Color: #64748b
- Font Size: 1rem
*/

// ============================================================================
// RESPONSIVE DESIGN
// ============================================================================

/*
BREAKPOINTS

Mobile: < 768px
Tablet: 768px - 1024px
Desktop: > 1024px

Grid Layouts:
Mobile: 1 column
Tablet: 2 columns
Desktop: 3-4 columns

Metric Cards:
Mobile: md:grid-cols-2
Tablet: md:grid-cols-2
Desktop: lg:grid-cols-4

Charts:
Mobile: Full width (stacked)
Tablet: Full width
Desktop: lg:grid-cols-2 (side by side)

Typography Scaling:
Mobile: -1 size level
Tablet: Standard
Desktop: Standard + more spacing

Padding Scaling:
Mobile: 16px (sm)
Tablet: 24px (lg)
Desktop: 32px (xl)
*/

// ============================================================================
// ACCESSIBILITY FEATURES
// ============================================================================

/*
CONTRAST RATIOS
- Text on background: 4.5:1 (WCAG AA)
- Large text on background: 3:1 (WCAG AA)
- Status indicators: Color + pattern/icon

FOCUS INDICATORS
- Keyboard users: Visible ring around elements
- Color: Blue (#0284c7) with 2px width
- Offset: 2px from element
- Works on all interactive elements

SEMANTIC HTML
- Proper heading hierarchy (h1 > h2 > h3)
- Navigation landmarks (<nav>, <main>, <aside>)
- Form labels associated with inputs
- ARIA labels for complex widgets

MOTION
- Reduced motion: Removes all animations
- Media query: prefers-reduced-motion
- Duration: 0.01ms for animation-duration
- Disabled: animation-iteration-count = 1

SCREEN READERS
- Screen reader only text where needed
- Proper alt text (if images added)
- ARIA attributes for complex interactions
*/

// ============================================================================
// DARK MODE IMPLEMENTATION
// ============================================================================

/*
CSS VARIABLES APPROACH
All colors defined as CSS variables in :root

Usage in Tailwind:
- bg-dark-primary: #0b0f1a
- bg-dark-secondary: #1e293b
- text-dark-primary: #f1f5f9
- text-dark-secondary: #cbd5e1
- border-dark-light: #334155

Alternative Colors:
- Tailwind slate-50 through slate-950
- slate-50 = light text
- slate-950 = dark backgrounds

Always use dark mode because:
✅ Reduces eye strain in SOC environments
✅ Professional security tool appearance
✅ Better for 24/7 monitoring
✅ Data visualization clarity
✅ Consistent with enterprise security tools
*/

// ============================================================================
// PROFESSIONAL APPEARANCE CHECKLIST
// ============================================================================

/*
WHEN REVIEWING UI:

Typography:
☑ Heading hierarchy is clear
☑ Font sizes are properly scaled
☑ Color contrast is sufficient
☑ Line heights are readable (1.4-1.6)

Spacing:
☑ Consistent padding in cards (24px)
☑ Consistent margins between sections
☑ Grid gaps are appropriate (16-24px)
☑ Breathing room around elements

Cards:
☑ Borders are subtle (#334155)
☑ Shadows add depth (md level)
☑ Hover states provide feedback
☑ Color variants are clear

Colors:
☑ Text is readable (#f1f5f9 on #1e293b)
☑ Accents match severity (red/yellow/green)
☑ Consistent throughout
☑ No clashing colors

Charts:
☑ Labels are readable
☑ Colors are distinct
☑ Legends are clear
☑ Responsive and not cramped

Interactions:
☑ Buttons have hover/active states
☑ Links are underlined or styled
☑ Focus is visible for keyboard users
☑ Transitions are smooth (0.2-0.3s)

Overall:
☑ Looks professional and polished
☑ Matches cybersecurity aesthetic
☑ Enterprise security monitor feel
☑ Responsive on all devices
☑ Accessible to all users
*/

export const STYLING_COMPLETE = true;
export const PROFESSIONAL_THEME = 'CybersecurityDark';
export const READY_FOR_PRODUCTION = true;
