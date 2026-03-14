/**
 * MedIoT Shield - UI Styling Constants
 * Centralized source of truth for colors, typography, spacing, and severity styling
 */

// ============================================================================
// SEVERITY STYLING - Used for alerts, indicators, and status displays
// ============================================================================

export interface SeverityStyle {
  badge: string;
  text: string;
  border: string;
  gradient: string;
  bgDark: string;
  bgLight: string;
}

export const SEVERITY_STYLES: Record<string, SeverityStyle> = {
  Critical: {
    badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300',
    text: 'text-red-700 dark:text-red-400',
    border: '#dc2626',
    gradient: 'from-red-500/15 to-orange-500/15',
    bgDark: 'bg-red-950/20',
    bgLight: 'bg-red-50',
  },
  Alert: {
    badge: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300',
    text: 'text-orange-700 dark:text-orange-400',
    border: '#ea580c',
    gradient: 'from-orange-500/15 to-yellow-500/15',
    bgDark: 'bg-orange-950/20',
    bgLight: 'bg-orange-50',
  },
  Warning: {
    badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: '#eab308',
    gradient: 'from-yellow-500/15 to-amber-500/15',
    bgDark: 'bg-yellow-950/20',
    bgLight: 'bg-yellow-50',
  },
  Info: {
    badge: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300',
    text: 'text-blue-700 dark:text-blue-400',
    border: '#0284c7',
    gradient: 'from-blue-500/15 to-cyan-500/15',
    bgDark: 'bg-blue-950/20',
    bgLight: 'bg-blue-50',
  },
};

// ============================================================================
// STATUS SEVERITY LEVELS
// ============================================================================

export type AlertSeverity = 'Critical' | 'Alert' | 'Warning' | 'Info';

export function getSeverityStyle(severity: AlertSeverity): SeverityStyle {
  return SEVERITY_STYLES[severity] || SEVERITY_STYLES.Info;
}

// ============================================================================
// TYPOGRAPHY CONSTANTS
// ============================================================================

export const TYPOGRAPHY = {
  // Heading sizes (rem)
  h1: '2.5rem',    // 40px
  h2: '1.875rem',  // 30px
  h3: '1.5rem',    // 24px
  h4: '1.25rem',   // 20px
  h5: '1.125rem',  // 18px
  h6: '1rem',      // 16px

  // Section titles (for consistent page headers)
  sectionTitle: '1.125rem', // 18px, font-bold
  cardTitle: '0.875rem',    // 14px, font-semibold
  label: '0.75rem',         // 12px, font-medium
  caption: '0.625rem',      // 10px, font-normal

  // Standard body text
  body: '1rem',
  small: '0.875rem',
};

// ============================================================================
// SPACING CONSTANTS
// ============================================================================

export const SPACING = {
  // Grid gaps for component layouts
  metricGridGap: '1.5rem',    // gap-6: 24px - standard metric grid spacing
  chartGridGap: '2rem',        // gap-8: 32px - generous chart spacing
  cardGridGap: '1rem',         // gap-4: 16px - dense layouts

  // Section spacing
  sectionMargin: '2rem',       // mb-8: 32px - between major sections
  cardMargin: '1.5rem',        // mb-6: 24px - between card rows
  itemMargin: '0.75rem',       // mb-3: 12px - between inline items

  // Padding
  cardPadding: '1.5rem',       // p-6: 24px - standard card padding
  largePadding: '2rem',        // p-8: 32px - large card padding
};

// ============================================================================
// COLOR PALETTE - For consistent theming
// ============================================================================

export const COLORS = {
  // Background colors
  bgPrimary: '#0b0f1a',       // Main background
  bgSecondary: '#1e293b',     // Card background
  bgTertiary: '#374151',      // Tertiary background

  // Accent colors
  success: '#22c55e',         // Green
  warning: '#eab308',         // Yellow
  danger: '#ef4444',          // Red
  info: '#0284c7',            // Blue
  purple: '#8b5cf6',          // Purple

  // Text colors
  textPrimary: '#f1f5f9',     // Primary text (light)
  textSecondary: '#cbd5e1',   // Secondary text (medium gray)
  textTertiary: '#94a3b8',    // Tertiary text (muted gray)

  // Borders
  borderLight: '#334155',
  borderDark: '#1e293b',

  // Cyber mode colors
  cyberRed: '#ef4444',
  cyberGlow: 'rgba(239, 68, 68, 0.1)',
};

// ============================================================================
// CHART STYLING CONSTANTS
// ============================================================================

export const CHART_COLORS = {
  // Primary chart colors
  primary: '#3b82f6',         // Blue
  success: '#22c55e',         // Green
  warning: '#eab308',         // Yellow
  danger: '#ef4444',          // Red

  // Chart styling
  gridStroke: '#e2e8f0',
  tooltipBg: '#1e293b',
  tooltipBorder: '#475569',
  textColor: '#cbd5e1',       // Improved contrast
  tickColor: '#94a3b8',
};

// ============================================================================
// GRID & LAYOUT CONSTANTS
// ============================================================================

export const LAYOUTS = {
  // Page max width
  maxWidth: '80rem',  // 7xl

  // Standard responsive breakpoints (Tailwind)
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================================================
// ANIMATION TIMING
// ============================================================================

export const ANIMATIONS = {
  // Easing functions (cubic-bezier)
  ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',

  // Duration timing constants (ms)
  fast: '150ms',
  base: '300ms',
  slow: '500ms',
  verySlow: '1000ms',
};
