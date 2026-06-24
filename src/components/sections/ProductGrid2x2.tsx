/**
 * PRODUCT GRID 2×2
 *
 * WHY FLATLIST WITH numColumns=2 (not FlashList):
 * FlashList supports numColumns but is optimized for single-column
 * or horizontal lists. For a 2-column grid with limited items (<20),
 * FlatList's column layout is simpler and equally performant.
 *
 * For grids with 50+ items (full category pages), FlashList numColumns
 * would be appropriate. This is a homepage section, typically 4-8 items.
 *
 * WHY React.memo here:
 * The section receives `section` (products array) and `onAction`.
 * Neither changes when user adds a product to cart.
 * Without memo, a cart update would re-render the entire grid section
 * wrapper, then each ProductCard inside it.
 * With memo on both ProductGrid2x2 AND ProductCard, only the specific
 * ProductCard rerenders.
 */

import React, { useCallback } from 'react';
import type {
  ListRenderItemInfo} from 'react-native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';

import type { ProductGrid2x2Section, SDUIProduct, SDUIAction } from '@/types/sdui.types';
import { useTheme } from '@engine/theme/ThemeEngine';
import { ProductCard } from '@components/common/ProductCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 16px outer + 8px gap + 16px outer

interface ProductGrid2x2Props {
  section: ProductGrid2x2Section;
  onAction: (action: SDUIAction) => void;
}

export const ProductGrid2x2Component: React.FC<ProductGrid2x2Props> = React.memo(
  ({ section, onAction }) => {
    const theme = useTheme();

    const renderProduct = useCallback(
      ({ item }: ListRenderItemInfo<SDUIProduct>) => (
        <View style={styles.cardWrapper}>
          <ProductCard
            product={item}
            onAction={onAction}
            cardWidth={CARD_WIDTH}
          />
        </View>
      ),
      [onAction]
    );

    const keyExtractor = useCallback(
      (item: SDUIProduct) => `grid-${section.id}-${item.id}`,
      [section.id]
    );

    const handleViewAll = useCallback(() => {
      if (section.viewAllAction) {
        onAction(section.viewAllAction);
      }
    }, [section.viewAllAction, onAction]);

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {section.title}
            </Text>
            {section.subtitle && (
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {section.subtitle}
              </Text>
            )}
          </View>
          {section.viewAllAction && (
            <TouchableOpacity onPress={handleViewAll}>
              <Text style={[styles.viewAll, { color: theme.primary }]}>View All →</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={section.products.slice(0, 4)} // WHY slice: Grid section shows max 4 (2×2)
          renderItem={renderProduct}
          keyExtractor={keyExtractor}
          numColumns={2}
          scrollEnabled={false} // WHY: Nested in FlashList; disable inner scroll
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContent}
        />
      </View>
    );
  }
);

ProductGrid2x2Component.displayName = 'ProductGrid2x2Component';

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '700',
  },
  columnWrapper: {
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  gridContent: {
    paddingBottom: 4,
  },
  cardWrapper: {
    flex: 1,
  },
});
