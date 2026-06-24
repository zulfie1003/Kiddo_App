/**
 * APP ROOT — Provider Composition
 *
 * WHY ORDER OF PROVIDERS MATTERS:
 *
 * Inner providers can depend on outer providers.
 * The dependency order (outer → inner):
 *
 * 1. ThemeProvider         — no dependencies
 * 2. OverlayEngineProvider — no dependencies (renders overlays in its tree)
 * 3. CampaignProvider      — depends on ThemeEngine (calls replaceTheme)
 * 4. ActionDispatcherProvider — depends on CartStore + CampaignEngine + OverlayEngine
 * 5. HomeScreen            — depends on all of the above
 *
 * WHY NOT ONE MEGA-PROVIDER:
 * Splitting providers means each re-renders independently.
 * ThemeProvider re-renders only on theme change.
 * CampaignProvider re-renders only on campaign switch.
 * ActionDispatcherProvider re-renders on cart/campaign/overlay changes.
 *
 * If merged into one, any single change would re-render all consumers.
 *
 * CART STORE (Zustand) — Not a Provider:
 * Zustand doesn't require a Provider. The store is a module-level
 * singleton. This avoids wrapping and makes the store accessible
 * anywhere without provider nesting.
 */

import React from 'react';
import { ThemeProvider } from '@engine/theme/ThemeEngine';
import { OverlayEngineProvider } from '@engine/overlay/OverlayEngine';
import { CampaignProvider } from '@engine/campaign/CampaignEngine';
import { ActionDispatcherProvider } from '@engine/action/ActionDispatcher';
import { HomeScreen } from '@screens/HomeScreen';
import { MOCK_HOMEPAGE_PAYLOAD } from '@mocks/homePagePayload';

export default function App() {
  const { theme, availableCampaigns } = MOCK_HOMEPAGE_PAYLOAD;

  return (
    /**
     * Provider tree order (outermost first):
     * ThemeProvider → OverlayEngineProvider → CampaignProvider
     * → ActionDispatcherProvider → HomeScreen
     */
    <ThemeProvider initialTheme={theme}>
      <OverlayEngineProvider>
        <CampaignProvider
          availableCampaigns={availableCampaigns}
        >
          <ActionDispatcherProvider>
            <HomeScreen />
          </ActionDispatcherProvider>
        </CampaignProvider>
      </OverlayEngineProvider>
    </ThemeProvider>
  );
}
