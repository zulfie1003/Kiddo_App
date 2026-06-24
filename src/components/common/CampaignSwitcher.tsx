/**
 * CAMPAIGN SWITCHER — Runtime Demo UI
 *
 * This component demonstrates that campaigns switch at runtime:
 * - No app reload
 * - No rebuild
 * - Theme, overlays, and dedicated rows all update instantly
 *
 * In production, campaigns are activated via backend payload.
 * This component is a developer/QA tool for testing campaign states.
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useCampaignContext } from '@engine/campaign/CampaignEngine';
import { useTheme } from '@engine/theme/ThemeEngine';
import { useOverlayEngine } from '@engine/overlay/OverlayEngine';
import type { SDUICampaign } from '@/types/sdui.types';

export const CampaignSwitcher: React.FC = React.memo(() => {
  const { availableCampaigns, activeCampaignId, switchCampaign, clearCampaign } = useCampaignContext();
  const theme = useTheme();
  const { showOverlay } = useOverlayEngine();

  const handleCampaignPress = useCallback(
    (campaign: SDUICampaign) => {
      switchCampaign(campaign.id);
      // Show campaign overlay when switching
      if (campaign.overlay) {
        showOverlay(campaign.overlay.id);
      }
    },
    [switchCampaign, showOverlay]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.borderColor }]}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        🎭 Campaign (Dev Tool)
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={clearCampaign}
            style={[
              styles.chip,
              {
                backgroundColor: !activeCampaignId ? theme.primary : theme.surface,
                borderColor: theme.borderColor,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: !activeCampaignId ? theme.badgeText : theme.textSecondary }]}>
              Default
            </Text>
          </TouchableOpacity>

          {availableCampaigns.map((campaign) => (
            <TouchableOpacity
              key={campaign.id}
              onPress={() => handleCampaignPress(campaign)}
              style={[
                styles.chip,
                {
                  backgroundColor: activeCampaignId === campaign.id ? theme.primary : theme.surface,
                  borderColor: activeCampaignId === campaign.id ? theme.primary : theme.borderColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: activeCampaignId === campaign.id ? theme.badgeText : theme.textSecondary },
                ]}
              >
                {campaign.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
});

CampaignSwitcher.displayName = 'CampaignSwitcher';

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
