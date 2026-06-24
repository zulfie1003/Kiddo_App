/**
 * HOME SCREEN
 *
 * WHY THIS IS THIN:
 * This screen's job is to:
 * 1. Fetch the payload (or use mock)
 * 2. Register overlays from payload
 * 3. Pass payload to DynamicRenderer
 *
 * All rendering logic lives in DynamicRenderer.
 * All business logic lives in engines and store.
 * This screen has zero business logic.
 *
 * WHY useMemo for payload:
 * In a real app, payload comes from an API call and is stored in
 * component state. useMemo prevents the payload object reference
 * from changing on unrelated re-renders, which would cause
 * DynamicRenderer (even with React.memo) to re-render.
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
} from 'react-native';

import { DynamicRenderer } from '@components/registry/DynamicRenderer';
import { CartBadge } from '@components/common/CartBadge';
import { CampaignSwitcher } from '@components/common/CampaignSwitcher';
import { useTheme } from '@engine/theme/ThemeEngine';
import { useOverlayEngine } from '@engine/overlay/OverlayEngine';
import { useCampaignContext } from '@engine/campaign/CampaignEngine';
import { useActionDispatcher } from '@engine/action/ActionDispatcher';
import { MOCK_HOMEPAGE_PAYLOAD } from '@mocks/homePagePayload';
import type { HomePagePayload } from '@/types/sdui.types';

export const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const { registerOverlay, showOverlay } = useOverlayEngine();
  const { activeCampaign } = useCampaignContext();
  const { dispatch } = useActionDispatcher();

  /**
   * WHY useMemo:
   * In production, replace MOCK_HOMEPAGE_PAYLOAD with API state.
   * useMemo here ensures the reference is stable across renders.
   * DynamicRenderer is memoized and only re-renders when payload changes.
   */
  const payload = useMemo<HomePagePayload>(() => MOCK_HOMEPAGE_PAYLOAD, []);

  /**
   * Register overlays from payload on mount.
   * WHY useEffect: registration is a side effect, not render logic.
   */
  useEffect(() => {
    payload.availableCampaigns?.forEach((campaign) => {
      if (campaign.overlay) {
        registerOverlay(campaign.overlay);
      }
    });
    if (payload.overlay) {
      registerOverlay(payload.overlay);
    }
  }, [payload, registerOverlay]);

  /**
   * Show campaign overlay when campaign activates.
   */
  useEffect(() => {
    if (activeCampaign?.overlay) {
      registerOverlay(activeCampaign.overlay);
      showOverlay(activeCampaign.overlay.id);
    }
  }, [activeCampaign, registerOverlay, showOverlay]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.background}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.borderColor },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.appName, { color: theme.primary }]}>🐣 KidsQ</Text>
          <Text style={[styles.deliveryText, { color: theme.textSecondary }]}>
            Delivery in 10 mins
          </Text>
        </View>
        <CartBadge />
      </View>

      {/* Campaign Switcher (Dev Tool) */}
      {__DEV__ && <CampaignSwitcher />}

      {/* Active Campaign Banner Strip
          WHY: When a campaign is active, the backend sends a bannerText and
          bannerAction. This strip surfaces it at the top of the feed.
          It's driven entirely by the campaign payload — zero hardcoding. */}
      {activeCampaign?.bannerText && (
        <TouchableOpacity
          style={[styles.campaignStrip, { backgroundColor: theme.primary }]}
          onPress={() => {
            if (activeCampaign.bannerAction) {
              dispatch(activeCampaign.bannerAction);
            }
          }}
          activeOpacity={0.85}
        >
          <Text style={[styles.campaignStripText, { color: theme.badgeText }]}>
            {activeCampaign.bannerText}
          </Text>
        </TouchableOpacity>
      )}

      {/* Main Renderer */}
      <DynamicRenderer payload={payload} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerLeft: {
    gap: 2,
  },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  deliveryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Campaign banner strip — server-driven, appears only when campaign active
  campaignStrip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  campaignStripText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
