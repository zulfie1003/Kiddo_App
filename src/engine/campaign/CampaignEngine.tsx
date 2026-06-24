/**
 * CAMPAIGN ENGINE
 *
 * WHY A SEPARATE CAMPAIGN ENGINE (not just theme switching):
 * A campaign is a composite of: theme + overlay + dedicated sections
 * + banner text + special actions. Switching a campaign atomically
 * updates all three without multiple separate state updates
 * (which would cause multiple renders).
 *
 * ATOMIC SWITCH:
 * Campaign switch updates ThemeEngine + OverlayEngine in a single
 * state update → single render pass → no flicker.
 *
 * RUNTIME SWITCH (no app reload):
 * The backend can change `activeCampaignId` in the payload.
 * The CampaignEngine applies it immediately. The ThemeEngine gets
 * the campaign's theme. Overlays are triggered. Dedicated rows appear.
 * Zero binary update required.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';

import type { SDUICampaign, CampaignId } from '@/types/sdui.types';
import { useThemeEngine } from '@engine/theme/ThemeEngine';
import { CAMPAIGN_DEFINITIONS } from './CampaignDefinitions';

// ─────────────────────────────────────────────
// CONTEXT TYPE
// ─────────────────────────────────────────────

interface CampaignContextValue {
  activeCampaign: SDUICampaign | null;
  activeCampaignId: CampaignId | null;
  availableCampaigns: SDUICampaign[];
  switchCampaign: (campaignId: string) => void;
  clearCampaign: () => void;
  isCampaignActive: (campaignId: CampaignId) => boolean;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

interface CampaignProviderProps {
  children: React.ReactNode;
  initialCampaignId?: CampaignId;
  availableCampaigns?: SDUICampaign[];
}

export const CampaignProvider: React.FC<CampaignProviderProps> = ({
  children,
  initialCampaignId,
  availableCampaigns = CAMPAIGN_DEFINITIONS,
}) => {
  const [activeCampaignId, setActiveCampaignId] = useState<CampaignId | null>(
    initialCampaignId ?? null
  );
  const { replaceTheme, resetToDefault } = useThemeEngine();

  /**
   * WHY useMemo for activeCampaign:
   * Avoid O(n) array search on every render.
   * Recompute only when activeCampaignId or availableCampaigns changes.
   */
  const activeCampaign = useMemo<SDUICampaign | null>(
    () =>
      activeCampaignId
        ? availableCampaigns.find((c) => c.id === activeCampaignId) ?? null
        : null,
    [activeCampaignId, availableCampaigns]
  );

  /**
   * WHY useEffect for theme sync:
   * When campaign changes, theme must update atomically.
   * We can't do this synchronously in switchCampaign because
   * replaceTheme is from a separate context (ThemeEngine).
   * useEffect ensures both state updates batch correctly.
   */
  useEffect(() => {
    if (activeCampaign?.theme) {
      replaceTheme(activeCampaign.theme);
    } else {
      resetToDefault();
    }
  }, [activeCampaign, replaceTheme, resetToDefault]);

  const switchCampaign = useCallback(
    (campaignId: string) => {
      const campaign = availableCampaigns.find((c) => c.id === campaignId);
      if (!campaign) {
        console.warn(
          `[CampaignEngine] Unknown campaign: "${campaignId}". ` +
            `Available: ${availableCampaigns.map((c) => c.id).join(', ')}`
        );
        return;
      }
      setActiveCampaignId(campaign.id);
    },
    [availableCampaigns]
  );

  const clearCampaign = useCallback(() => {
    setActiveCampaignId(null);
  }, []);

  const isCampaignActive = useCallback(
    (campaignId: CampaignId): boolean => activeCampaignId === campaignId,
    [activeCampaignId]
  );

  const value = useMemo<CampaignContextValue>(
    () => ({
      activeCampaign,
      activeCampaignId,
      availableCampaigns,
      switchCampaign,
      clearCampaign,
      isCampaignActive,
    }),
    [activeCampaign, activeCampaignId, availableCampaigns, switchCampaign, clearCampaign, isCampaignActive]
  );

  return (
    <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>
  );
};

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useCampaignContext(): CampaignContextValue {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error(
      '[useCampaignContext] Must be used within CampaignProvider.'
    );
  }
  return context;
}
