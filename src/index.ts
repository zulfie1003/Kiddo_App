/**
 * BARREL EXPORTS
 *
 * WHY BARREL FILES:
 * Instead of deep relative imports like:
 *   import { CartBadge } from '../../../components/common/CartBadge'
 *
 * You write:
 *   import { CartBadge } from '@components/common'
 *
 * This makes refactoring safe: move a file, update the barrel, done.
 * All import sites remain unchanged.
 *
 * WHY NOT BARREL EVERYTHING:
 * Barrels can cause circular dependency issues if over-used.
 * We use them only at the module boundary level (components, engines).
 * Internal files still import each other directly.
 */

// Types
export * from './types/sdui.types';

// Engines
export { ThemeProvider, useTheme, useThemeEngine, DEFAULT_THEME } from './engine/theme/ThemeEngine';
export { CampaignProvider, useCampaignContext } from './engine/campaign/CampaignEngine';
export { OverlayEngineProvider, useOverlayEngine } from './engine/overlay/OverlayEngine';
export { ActionDispatcherProvider, useActionDispatcher } from './engine/action/ActionDispatcher';

// Store
export { useCartStore, cartCountSelector, cartItemQuantitySelector, cartTotalPriceSelector } from './store/CartStore';

// Registry
export { resolveComponent, isRegisteredType, getRegisteredTypes } from './components/registry/ComponentRegistry';
export { DynamicRenderer } from './components/registry/DynamicRenderer';

// Common Components
export { ErrorBoundary } from './components/common/ErrorBoundary';
export { CartBadge } from './components/common/CartBadge';
export { ProductCard } from './components/common/ProductCard';
export { CampaignSwitcher } from './components/common/CampaignSwitcher';

// Section Components
export { BannerHeroComponent } from './components/sections/BannerHero';
export { ProductGrid2x2Component } from './components/sections/ProductGrid2x2';
export { DynamicCollectionComponent } from './components/sections/DynamicCollection';
export { HeaderBannerComponent } from './components/sections/HeaderBanner';
export { CategoryGridComponent } from './components/sections/CategoryGrid';
export { FlashSaleComponent } from './components/sections/FlashSale';
export { SpacerComponent } from './components/sections/Spacer';
export { DividerComponent } from './components/sections/Divider';

// Hooks
export { useHomepagePayload, useCartItem, useStableCallback } from './hooks/useSdui';

// Utils
export { formatPrice, formatDiscount, formatRating, addAlpha, logger } from './utils/helpers';

// Mocks
export { MOCK_HOMEPAGE_PAYLOAD } from './mocks/homePagePayload';
