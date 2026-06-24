/**
 * DYNAMIC RENDERER
 *
 * This is the heart of the SDUI system. It:
 * 1. Receives the backend payload
 * 2. Iterates sections via FlashList (vertical scroll, outer list)
 * 3. Resolves each section type via ComponentRegistry
 * 4. Wraps each resolved component in an ErrorBoundary
 * 5. Passes the Action Dispatcher down as a stable callback
 *
 * WHY FLASHLIST OVER FLATLIST:
 * FlashList does not measure item layout per render cycle.
 * It reuses cell instances (recycling). At 50+ sections, FlatList
 * causes jank during fast scroll. FlashList maintains 60 FPS.
 *
 * WHY estimatedItemSize:
 * FlashList pre-allocates scroll space using this value.
 * If omitted, it falls back to measuring each item (defeats the purpose).
 * 120dp is a safe average for mixed section heights.
 *
 * WHY keyExtractor uses section.id:
 * Using index as key causes React to remount components when list
 * order changes (backend reorders sections for A/B tests).
 * Stable string IDs prevent unnecessary unmounts.
 */

import React, { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import type { ListRenderItemInfo } from '@shopify/flash-list';
import { FlashList } from '@shopify/flash-list';

import type { SDUISection, SDUIAction, HomePagePayload } from '@/types/sdui.types';
import { resolveComponent } from './ComponentRegistry';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { useActionDispatcher } from '@engine/action/ActionDispatcher';
import { isValidSection } from '@/types/sdui.types';
import { useCampaignContext } from '@engine/campaign/CampaignEngine';

interface DynamicRendererProps {
  payload: HomePagePayload;
}

/**
 * WHY React.memo here:
 * The renderer is the root component. Without memo, any parent
 * state change would re-render the entire tree. With memo,
 * it only re-renders when `payload` reference changes
 * (i.e., when backend sends a new payload).
 */
const DynamicRenderer: React.FC<DynamicRendererProps> = React.memo(({ payload }) => {
  const { dispatch } = useActionDispatcher();
  const { activeCampaignId } = useCampaignContext();

  /**
   * WHY useCallback:
   * This callback is passed as a prop to every section component.
   * Without useCallback, a new function reference is created every
   * render, causing ALL section components to re-render even when
   * only one section's data changed.
   *
   * With useCallback and empty deps [], the reference is stable
   * for the lifetime of this component.
   */
  const handleAction = useCallback(
    (action: SDUIAction) => {
      dispatch(action);
    },
    [dispatch]
  );

  /**
   * WHY useMemo for filteredSections:
   * Two-pass filter:
   *
   * Pass 1 — Runtime validation: filters malformed sections from backend.
   *
   * Pass 2 — Campaign filtering: sections with isCampaignRow=true are
   * ONLY shown when their specific campaign is active.
   *
   * WHY here (not in backend payload):
   * The backend sends ALL possible sections always. The client decides
   * which are visible based on the active campaign. This allows the
   * backend to pre-populate campaign rows and the client to show/hide
   * them instantly on campaign switch — no refetch needed.
   *
   * Example:
   *   active campaign = 'back_to_school'
   *   → campaign-back-to-school-row: SHOWN ✓
   *   → campaign-summer-playhouse-row: HIDDEN ✗
   *   → campaign-mystery-gift-row: HIDDEN ✗
   *   → all non-campaign sections: SHOWN ✓
   */
  const filteredSections = useMemo(() => {
    return payload.sections.filter((section) => {
      // Pass 1: structural validation
      const valid = isValidSection(section);
      if (!valid) {
        console.warn(
          `[DynamicRenderer] Invalid section detected. Skipping:`,
          JSON.stringify(section).slice(0, 100)
        );
        return false;
      }

      // Pass 2: campaign row gating
      // Only DynamicCollectionSection can be a campaign row
      if (section.type === 'DYNAMIC_COLLECTION') {
        const collectionSection = section;
        if (collectionSection.isCampaignRow) {
          // Show this row ONLY if its campaign is currently active
          const isActive = collectionSection.campaignId === activeCampaignId;
          if (!isActive) {
            // Not crashing, not warning — this is intentional hiding
            return false;
          }
        }
      }

      return true;
    });
  }, [payload.sections, activeCampaignId]);

  /**
   * WHY this pattern for renderItem:
   * 1. useCallback prevents function recreation on each render
   * 2. The inner anonymous component is NOT memoized here because
   *    FlashList handles recycling. The resolved component itself
   *    should be memoized internally.
   * 3. ErrorBoundary wraps EACH section individually.
   *    If BannerHero throws, ProductGrid still renders.
   */
  const renderItem = useCallback(
    ({ item: section }: ListRenderItemInfo<SDUISection>) => {
      const ResolvedComponent = resolveComponent(section.type);

      if (!ResolvedComponent) {
        // Unknown type from backend — gracefully skip
        // ErrorBoundary not needed; we're not rendering anything
        return null;
      }

      return (
        <ErrorBoundary
          fallback={null}
          onError={(error) => {
            console.error(
              `[DynamicRenderer] Section "${section.type}" (id: ${section.id}) crashed:`,
              error.message
            );
          }}
        >
          <ResolvedComponent
            // WHY type cast: The registry guarantees type safety at
            // registration time. The cast avoids duplicating type
            // narrowing logic in the renderer.
            section={section as never}
            onAction={handleAction}
          />
        </ErrorBoundary>
      );
    },
    [handleAction]
  );

  /**
   * WHY keyExtractor as separate useCallback:
   * Passing an inline arrow function `(item) => item.id` creates
   * a new reference every render. FlashList uses this to determine
   * if items should be recycled or remounted.
   * Stable reference → fewer unnecessary remounts.
   */
  const keyExtractor = useCallback((item: SDUISection) => item.id, []);

  /**
   * WHY getItemType:
   * FlashList groups cells by type for recycling.
   * Recycling a BANNER_HERO cell for a PRODUCT_GRID cell would
   * cause visual glitches. This tells FlashList to only recycle
   * cells of the same type.
   */
  const getItemType = useCallback((item: SDUISection) => item.type, []);

  return (
    <FlashList
      data={filteredSections}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      /**
       * WHY 120:
       * Average section height across all registered types.
       * Banner ≈ 200, Collection ≈ 300, Spacer ≈ 16.
       * 120 is a reasonable middle ground. Tune per app metrics.
       */
      estimatedItemSize={120}
      /**
       * WHY removeClippedSubviews:
       * On Android, this unmounts components that are off-screen,
       * reducing memory pressure. On iOS, it's handled by the
       * native scroll view but still helps.
       */
      removeClippedSubviews
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      /**
       * WHY onEndReachedThreshold 0.3:
       * Triggers pagination/prefetch when user is 30% from the
       * bottom. For SDUI, this is where you'd fetch the next
       * page of sections (infinite scroll homepages).
       */
      onEndReachedThreshold={0.3}
    />
  );
});

DynamicRenderer.displayName = 'DynamicRenderer';

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 100,
  },
});

export { DynamicRenderer };
