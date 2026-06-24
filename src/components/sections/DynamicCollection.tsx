/**
 * DYNAMIC COLLECTION — Horizontal FlashList nested in vertical FlashList
 *
 * THE NESTED LIST CHALLENGE:
 * Nesting a horizontal list inside a vertical list is the most common
 * source of performance bugs in React Native. Two scroll views compete
 * for the same touch events.
 *
 * SOLUTIONS APPLIED:
 *
 * 1. GESTURE CONFLICT PREVENTION:
 *    - The outer FlashList scrolls vertically (default)
 *    - The inner FlashList scrolls horizontally
 *    - React Native resolves gesture conflicts by direction:
 *      if gesture angle > 45°, outer handles; if < 45°, inner handles
 *    - No custom gesture responder needed for simple case
 *
 * 2. VIRTUALIZATION:
 *    - Outer FlashList: renders only visible rows (sections)
 *    - Inner FlashList: renders only visible cards in the row
 *    - WHY: A "collections" section with 30 products would mount
 *      all 30 ProductCard components without virtualization.
 *      With FlashList, only ~4-5 visible cards are mounted at a time.
 *
 * 3. RECYCLING (FlashList-specific):
 *    - FlashList pools cell instances by `getItemType`
 *    - When you scroll right past a card, its View is NOT destroyed
 *    - It's put in a recycle pool and reused for the next card
 *    - This eliminates the create/destroy cycle (garbage collection pressure)
 *
 * 4. estimatedItemSize:
 *    - FlashList needs to know scroll range before items are measured
 *    - Without this, it can't render the correct number of initial items
 *    - For product cards: 140px width is a safe default
 *
 * 5. keyExtractor STRATEGY:
 *    - Using product.id (not index) ensures React reconciles correctly
 *    - If the backend reorders products (A/B test), React won't unmount
 *      all cards and remount them — it moves them in the DOM
 *
 * 6. NO MEMORY LEAKS:
 *    - Callbacks wrapped in useCallback to prevent stale closures
 *    - No setTimeout or setInterval inside this component
 *    - FlashList handles its own cleanup on unmount
 *
 * 7. NO DROPPED FRAMES:
 *    - Product images lazy-load (Image component handles this)
 *    - No heavy computation in render paths
 *    - Quantity state lives in Zustand (isolated, not in component tree)
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ListRenderItemInfo } from '@shopify/flash-list';
import { FlashList } from '@shopify/flash-list';

import type {
  DynamicCollectionSection,
  SDUIProduct,
  SDUIAction,
} from '@/types/sdui.types';
import { useTheme } from '@engine/theme/ThemeEngine';
import { ProductCard } from '@components/common/ProductCard';

// Card dimensions — must match estimatedItemSize
const CARD_WIDTH = 140;
const CARD_MARGIN = 8;

interface DynamicCollectionProps {
  section: DynamicCollectionSection;
  onAction: (action: SDUIAction) => void;
}

// ─────────────────────────────────────────────
// DYNAMIC COLLECTION
// ─────────────────────────────────────────────

export const DynamicCollectionComponent: React.FC<DynamicCollectionProps> = React.memo(
  ({ section, onAction }) => {
    const theme = useTheme();

    /**
     * WHY useCallback for renderItem:
     * renderItem is called for every visible item on every render.
     * If renderItem is a new function reference each render,
     * FlashList must diff ALL visible items against new references.
     * With useCallback, the reference is stable → FlashList skips the diff.
     */
    const renderProduct = useCallback(
      ({ item: product }: ListRenderItemInfo<SDUIProduct>) => (
        <ProductCard
          product={product}
          onAction={onAction}
          style={styles.cardWrapper}
          cardWidth={CARD_WIDTH}
        />
      ),
      [onAction]
    );

    /**
     * WHY stable keyExtractor:
     * Defined outside render or wrapped in useCallback.
     * FlashList uses this to match recycled cells to items.
     * Unstable keyExtractor causes unnecessary cell remounting.
     */
    const keyExtractor = useCallback(
      (item: SDUIProduct) => `${section.id}-${item.id}`,
      [section.id]
    );

    /**
     * WHY getItemType with card style:
     * If the section has mixed card styles (compact + featured),
     * FlashList must NOT recycle a featured card cell for a compact card.
     * getItemType ensures cells are only recycled for matching types.
     */
    const getItemType = useCallback(
      (_item: SDUIProduct) => section.cardStyle,
      [section.cardStyle]
    );

    const handleViewAll = useCallback(() => {
      if (section.viewAllAction) {
        onAction(section.viewAllAction);
      }
    }, [section.viewAllAction, onAction]);

    return (
      <View
        style={[
          styles.container,
          section.isCampaignRow && {
            backgroundColor: theme.primary + '15', // 15 = 8% opacity
            borderRadius: 16,
            marginHorizontal: 12,
          },
        ]}
      >
        {/* Section Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {section.isCampaignRow && (
              <View style={[styles.campaignBadge, { backgroundColor: theme.primary }]}>
                <Text style={[styles.campaignBadgeText, { color: theme.badgeText }]}>
                  🎯 Special
                </Text>
              </View>
            )}
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {section.title}
            </Text>
            {section.subtitle && (
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                {section.subtitle}
              </Text>
            )}
          </View>

          {section.viewAllAction && (
            <TouchableOpacity onPress={handleViewAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>
                View All →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal FlashList */}
        {/**
         * WHY horizontal FlashList inside vertical FlashList:
         *
         * VIRTUALIZATION MATH:
         * Screen width = 390px. Card width = 140px + 8px margin = 148px.
         * Visible cards at once = ~2.6 cards.
         * Without FlashList: all 20 cards mounted = 20 × (Image + Text + Button) = heavy
         * With FlashList: only 4 cards mounted (2.6 visible + 1.4 buffer) = light
         *
         * RECYCLING:
         * Scroll right 1 card: leftmost card enters recycle pool.
         * New card needed on right: taken from pool, data updated. No mount.
         *
         * This is why FlashList renders 60 FPS with 100 products.
         * FlatList would drop frames because it mounts all 100.
         */}
        <FlashList
          data={section.products}
          renderItem={renderProduct}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          horizontal
          /**
           * WHY estimatedItemSize = CARD_WIDTH + CARD_MARGIN:
           * FlashList uses this to pre-calculate total scroll width.
           * Without it, FlashList measures each card → defeats purpose.
           * Value must be close to actual size. Too wrong → scroll jumps.
           */
          estimatedItemSize={CARD_WIDTH + CARD_MARGIN}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          /**
           * WHY removeClippedSubviews for horizontal list:
           * Cards far off-screen to the left are unmounted on Android.
           * Reduces memory when user has scrolled far right.
           */
          removeClippedSubviews
          /**
           * WHY extraData undefined:
           * We don't pass extraData because product cards read cart
           * state directly from Zustand (not via prop drilling).
           * extraData would cause full list re-render on every cart change.
           */
        />
      </View>
    );
  }
);

DynamicCollectionComponent.displayName = 'DynamicCollectionComponent';

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    gap: 2,
  },
  campaignBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
  },
  campaignBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  cardWrapper: {
    marginRight: CARD_MARGIN,
  },
});
