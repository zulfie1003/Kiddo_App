/**
 * CAMPAIGN DEFINITIONS
 *
 * WHY SEPARATE FILE:
 * Campaign data is the "content" of the campaign engine.
 * In production, these would come from the backend payload.
 * Here they are defined as constants for local fallback and testing.
 *
 * Each campaign has:
 * - theme: Complete color system override
 * - overlay: Lottie animation to show when campaign is active
 * - dedicatedSectionIds: Section IDs that appear ONLY in this campaign
 */

import type { SDUICampaign, SDUITheme } from '@/types/sdui.types';

// ─────────────────────────────────────────────
// CAMPAIGN THEMES
// ─────────────────────────────────────────────

const BACK_TO_SCHOOL_THEME: SDUITheme = {
  primary: '#F5C842',        // School bus yellow
  secondary: '#1B4FD8',     // Royal blue
  background: '#FFFDF0',
  surface: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#4A4A4A',
  accent: '#F5C842',
  error: '#EF4444',
  success: '#10B981',
  cardBackground: '#FFFFF0',
  borderColor: '#F5C842',
  badgeBackground: '#1B4FD8',
  badgeText: '#FFFFFF',
};

const SUMMER_PLAYHOUSE_THEME: SDUITheme = {
  primary: '#0EA5E9',        // Ocean blue
  secondary: '#38BDF8',     // Sky blue
  background: '#F0F9FF',
  surface: '#FFFFFF',
  textPrimary: '#0C1A2E',
  textSecondary: '#1E3A5F',
  accent: '#FCD34D',
  error: '#EF4444',
  success: '#10B981',
  cardBackground: '#E0F4FF',
  borderColor: '#BAE6FD',
  badgeBackground: '#0EA5E9',
  badgeText: '#FFFFFF',
};

const MYSTERY_GIFT_CARNIVAL_THEME: SDUITheme = {
  primary: '#DC2626',        // Carnival red
  secondary: '#7C3AED',     // Purple
  background: '#FFF5F5',
  surface: '#FFFFFF',
  textPrimary: '#1A0000',
  textSecondary: '#7F1D1D',
  accent: '#F59E0B',
  error: '#EF4444',
  success: '#10B981',
  cardBackground: '#FFF0F0',
  borderColor: '#FCA5A5',
  badgeBackground: '#DC2626',
  badgeText: '#FFFFFF',
};

// ─────────────────────────────────────────────
// CAMPAIGN DEFINITIONS
// ─────────────────────────────────────────────

export const CAMPAIGN_DEFINITIONS: SDUICampaign[] = [
  {
    id: 'back_to_school',
    name: 'Back To School',
    isActive: false,
    startDate: '2024-08-01',
    endDate: '2024-09-15',
    theme: BACK_TO_SCHOOL_THEME,
    overlay: {
      id: 'overlay-back-to-school',
      type: 'FULL_SCREEN_OVERLAY',
      // WHY: Using a well-known Lottie URL for demo. In production,
      // these are served from a CDN under your control.
      animationUrl: 'https://assets10.lottiefiles.com/packages/lf20_touohxv0.json',
      durationMs: 3000,
      loop: false,
      dismissible: true,
      autoDismissMs: 4000,
      zIndex: 999,
    },
    dedicatedSectionIds: ['campaign-back-to-school-row'],
    bannerText: '📚 Back to School Sale — Up to 40% off!',
    bannerAction: {
      type: 'DEEP_LINK',
      payload: { url: '/campaign/back-to-school' },
    },
  },

  {
    id: 'summer_playhouse',
    name: 'Summer Playhouse',
    isActive: false,
    startDate: '2024-06-01',
    endDate: '2024-07-31',
    theme: SUMMER_PLAYHOUSE_THEME,
    overlay: {
      id: 'overlay-summer-playhouse',
      type: 'FULL_SCREEN_OVERLAY',
      animationUrl: 'https://assets3.lottiefiles.com/packages/lf20_vu6yw9by.json',
      durationMs: 2500,
      loop: false,
      dismissible: true,
      autoDismissMs: 3500,
      zIndex: 999,
    },
    dedicatedSectionIds: ['campaign-summer-playhouse-row'],
    bannerText: '🌊 Summer Playhouse — Fun under the sun!',
    bannerAction: {
      type: 'DEEP_LINK',
      payload: { url: '/campaign/summer-playhouse' },
    },
  },

  {
    id: 'mystery_gift_carnival',
    name: 'Mystery Gift Carnival',
    isActive: false,
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    theme: MYSTERY_GIFT_CARNIVAL_THEME,
    overlay: {
      id: 'overlay-mystery-gift',
      type: 'FULL_SCREEN_OVERLAY',
      animationUrl: 'https://assets2.lottiefiles.com/packages/lf20_obhph3t0.json',
      durationMs: 4000,
      loop: true,
      dismissible: true,
      autoDismissMs: 6000,
      zIndex: 999,
    },
    dedicatedSectionIds: ['campaign-mystery-gift-row'],
    bannerText: '🎪 Mystery Gift Carnival — Tap to reveal your gift!',
    bannerAction: {
      type: 'APPLY_MYSTERY_GIFT_COUPON',
      payload: { couponCode: 'CARNIVAL2024', expiresAt: '2024-12-31' },
    },
  },
];

export const CAMPAIGN_MAP: Record<string, SDUICampaign> = Object.fromEntries(
  CAMPAIGN_DEFINITIONS.map((c) => [c.id, c])
);
