/**
 * COMPONENT REGISTRY — Factory Pattern
 *
 * WHY REGISTRY OVER SWITCH:
 * A switch statement requires modifying the renderer every time a new
 * component type is added. The registry pattern decouples component
 * registration from rendering. New components are registered once;
 * the renderer never changes.
 *
 * WHY NOT LAZY LOADING HERE:
 * For a Q-Commerce homepage, all above-the-fold components must be
 * instantly available. Lazy loading would cause flicker. Below-the-fold
 * sections (like flash sale) could be lazy-loaded in v2.
 *
 * FAULT TOLERANCE:
 * registry[unknownType] returns undefined → renderer logs + skips.
 * The page never crashes due to a new server-sent component type.
 */

import type { ComponentRegistry, SDUISectionType } from '@/types/sdui.types';

import { BannerHeroComponent } from '@components/sections/BannerHero';
import { ProductGrid2x2Component } from '@components/sections/ProductGrid2x2';
import { DynamicCollectionComponent } from '@components/sections/DynamicCollection';
import { HeaderBannerComponent } from '@components/sections/HeaderBanner';
import { CategoryGridComponent } from '@components/sections/CategoryGrid';
import { FlashSaleComponent } from '@components/sections/FlashSale';
import { SpacerComponent } from '@components/sections/Spacer';
import { DividerComponent } from '@components/sections/Divider';

/**
 * The single source of truth for all renderable section types.
 * To add a new component:
 *   1. Create the component file
 *   2. Add one line here
 *   3. Done. Renderer auto-picks it up.
 */
const COMPONENT_REGISTRY: ComponentRegistry = {
  BANNER_HERO: BannerHeroComponent as ComponentRegistry[SDUISectionType],
  PRODUCT_GRID_2X2: ProductGrid2x2Component as ComponentRegistry[SDUISectionType],
  DYNAMIC_COLLECTION: DynamicCollectionComponent as ComponentRegistry[SDUISectionType],
  HEADER_BANNER: HeaderBannerComponent as ComponentRegistry[SDUISectionType],
  CATEGORY_GRID: CategoryGridComponent as ComponentRegistry[SDUISectionType],
  FLASH_SALE: FlashSaleComponent as ComponentRegistry[SDUISectionType],
  SPACER: SpacerComponent as ComponentRegistry[SDUISectionType],
  DIVIDER: DividerComponent as ComponentRegistry[SDUISectionType],
};

/**
 * Resolve a component from the registry.
 * Returns undefined (not throws) for unknown types.
 * The renderer handles undefined gracefully.
 */
export function resolveComponent(type: string): ComponentRegistry[SDUISectionType] | undefined {
  const component = COMPONENT_REGISTRY[type as SDUISectionType];

  if (!component) {
    // WHY console.warn not throw: We want the page to survive unknown
    // component types. This is logged so engineers can monitor for
    // new component types deployed by backend before client update.
    console.warn(
      `[ComponentRegistry] Unknown component type: "${type}". ` +
        `Skipping render. Register this type in ComponentRegistry.ts to resolve.`
    );
    return undefined;
  }

  return component;
}

/**
 * Check if a type is registered without resolving.
 * Useful for pre-flight validation of payloads.
 */
export function isRegisteredType(type: string): type is SDUISectionType {
  return type in COMPONENT_REGISTRY;
}

/**
 * Get all registered types. Used in dev tools / debugging.
 */
export function getRegisteredTypes(): SDUISectionType[] {
  return Object.keys(COMPONENT_REGISTRY) as SDUISectionType[];
}

export { COMPONENT_REGISTRY };
