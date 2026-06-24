/**
 * THEME ENGINE — OTA Theme Injection
 *
 * WHY CONTEXT FOR THEME (not Zustand):
 * Theme is a "global environmental value" that all nested components
 * consume. React Context is designed exactly for this. The theme
 * changes infrequently (only on campaign switch or payload refresh).
 * Zustand is better for frequently-updated, granular state (cart).
 *
 * WHY NOT STYLESHEET.CREATE FOR THEME COLORS:
 * StyleSheet.create() computes styles at module load time.
 * Dynamic themes from the server cannot be injected into
 * pre-computed StyleSheets. We use inline style objects for
 * theme-dependent values and StyleSheet.create() for structural styles.
 *
 * OTA UPDATE FLOW:
 * Backend sends new theme in payload → ThemeProvider updates context →
 * All consumers (buttons, cards, headers) re-render with new colors →
 * Zero app update required.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { ViewStyle } from 'react-native';
import type { SDUITheme } from '@/types/sdui.types';

// ─────────────────────────────────────────────
// DEFAULT THEME — Fallback when backend is unavailable
// ─────────────────────────────────────────────

export const DEFAULT_THEME: SDUITheme = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  background: '#FFF9F5',
  surface: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  accent: '#FFD93D',
  error: '#EF4444',
  success: '#10B981',
  cardBackground: '#FFFFFF',
  borderColor: '#E5E7EB',
  badgeBackground: '#FF6B6B',
  badgeText: '#FFFFFF',
};

// ─────────────────────────────────────────────
// CONTEXT TYPE
// ─────────────────────────────────────────────

interface ThemeContextValue {
  theme: SDUITheme;
  updateTheme: (newTheme: Partial<SDUITheme>) => void;
  replaceTheme: (newTheme: SDUITheme) => void;
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Initial theme from backend payload */
  initialTheme?: SDUITheme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = DEFAULT_THEME,
}) => {
  const [theme, setTheme] = useState<SDUITheme>(initialTheme);

  /**
   * WHY useCallback:
   * These functions are passed through context. Without useCallback,
   * every render of ThemeProvider creates new function references,
   * causing ALL context consumers to re-render.
   * With useCallback and stable deps, the functions are stable.
   */
  const updateTheme = useCallback((newTheme: Partial<SDUITheme>) => {
    setTheme((prev) => ({ ...prev, ...newTheme }));
  }, []);

  const replaceTheme = useCallback((newTheme: SDUITheme) => {
    setTheme(newTheme);
  }, []);

  const resetToDefault = useCallback(() => {
    setTheme(DEFAULT_THEME);
  }, []);

  /**
   * WHY useMemo for context value:
   * The context value object is recreated on every render.
   * Without useMemo, every ThemeContext consumer re-renders even
   * if theme didn't change (e.g., parent re-rendered for unrelated reason).
   * useMemo memoizes the value object, only updating when `theme` changes.
   */
  const value = useMemo<ThemeContextValue>(
    () => ({ theme, updateTheme, replaceTheme, resetToDefault }),
    [theme, updateTheme, replaceTheme, resetToDefault]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useTheme(): SDUITheme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(
      '[useTheme] Must be used within ThemeProvider. ' +
        'Wrap your root component with <ThemeProvider>.'
    );
  }
  return context.theme;
}

export function useThemeEngine(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(
      '[useThemeEngine] Must be used within ThemeProvider.'
    );
  }
  return context;
}

// ─────────────────────────────────────────────
// THEME HELPERS
// WHY: Utility functions for computed theme values.
// Centralizes logic like "what color should text be on primary bg?"
// ─────────────────────────────────────────────

/** Returns white or black based on background luminance */
export function getContrastText(backgroundColor: string): string {
  // Parse hex color
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance (WCAG formula)
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 128 ? '#1A1A2E' : '#FFFFFF';
}

/** Create themed shadow style */
export function createShadowStyle(theme: SDUITheme): ViewStyle {
  return {
    shadowColor: theme.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  };
}
