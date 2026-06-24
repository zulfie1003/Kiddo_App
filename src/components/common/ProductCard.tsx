/**
 * PRODUCT CARD — Most Performance-Critical Component
 *
 * WHY THIS IS THE MOST IMPORTANT MEMO BOUNDARY:
 * A homepage with 5 collections × 15 products = 75 ProductCard instances.
 * Without React.memo, every cart update (add/remove) would re-render all 75.
 * With React.memo + Zustand selector, only the specific product's card rerenders.
 *
 * ZUSTAND SELECTOR ISOLATION (the key insight):
 *
 *   const quantity = useCartStore(cartItemQuantitySelector(product.id));
 *
 * This creates a subscription SPECIFICALLY for this product's quantity.
 * Adding product-A does NOT trigger this hook if product.id !== 'A'.
 * React never re-renders this component for unrelated cart changes.
 *
 * PROOF that other products don't rerender:
 * Zustand internally calls: prevQuantity === nextQuantity
 * If quantities are equal, the subscriber is NOT notified.
 * React never schedules a re-render.
 *
 * WHY NOT PASS quantity AS PROP:
 * If quantity came from a parent prop, the PARENT would need to
 * subscribe to the cart and re-render, passing new props down to
 * ALL product cards. That's exactly what we want to avoid.
 * Each card subscribes independently = isolated rerenders.
 */

import React, { useCallback } from 'react';
import type {
  ViewStyle} from 'react-native';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

import type { SDUIProduct, SDUIAction } from '@/types/sdui.types';
import { useTheme } from '@engine/theme/ThemeEngine';
import {
  useCartStore,
  cartItemQuantitySelector,
} from '@store/CartStore';

interface ProductCardProps {
  product: SDUIProduct;
  onAction: (action: SDUIAction) => void;
  style?: ViewStyle;
  cardWidth?: number;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(
  ({ product, onAction, style, cardWidth = 140 }) => {
    const theme = useTheme();

    /**
     * WHY cartItemQuantitySelector(product.id):
     * Selector factory returns a function: (state) => state.items[product.id]?.quantity ?? 0
     * Zustand calls this selector after every store update.
     * If the return value didn't change, this component is NOT re-rendered.
     *
     * Example: Cart has {prod-1: qty=2, prod-2: qty=1}
     * User adds prod-3. Store updates.
     * Zustand runs selector for each subscriber:
     *   - CartBadge: count 3→4, rerenders ✓
     *   - ProductCard(prod-1): 2→2, NO rerender ✓
     *   - ProductCard(prod-2): 1→1, NO rerender ✓
     *   - ProductCard(prod-3): 0→1, rerenders ✓
     */
    const quantity = useCartStore(cartItemQuantitySelector(product.id));

    // Subscribe to store actions directly (stable references)
    const incrementQuantity = useCartStore((s) => s.incrementQuantity);
    const decrementQuantity = useCartStore((s) => s.decrementQuantity);

    const handleTap = useCallback(() => {
      onAction(product.onTapAction);
    }, [onAction, product.onTapAction]);

    const handleAddToCart = useCallback(() => {
      onAction(product.onAddToCartAction);
    }, [onAction, product.onAddToCartAction]);

    const handleIncrement = useCallback(() => {
      incrementQuantity(product.id);
    }, [incrementQuantity, product.id]);

    const handleDecrement = useCallback(() => {
      decrementQuantity(product.id);
    }, [decrementQuantity, product.id]);

    const discountLabel =
      product.discountPercent && product.discountPercent > 0
        ? `${product.discountPercent}% OFF`
        : null;

    return (
      <TouchableOpacity
        onPress={handleTap}
        activeOpacity={0.9}
        style={[
          styles.card,
          {
            width: cardWidth,
            backgroundColor: theme.cardBackground,
            borderColor: theme.borderColor,
          },
          style,
        ]}
      >
        {/* Discount Badge */}
        {discountLabel && (
          <View
            style={[
              styles.discountBadge,
              { backgroundColor: theme.badgeBackground },
            ]}
          >
            <Text style={[styles.discountText, { color: theme.badgeText }]}>
              {discountLabel}
            </Text>
          </View>
        )}

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}

        {/* Product Image */}
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.productImage}
          resizeMode="contain"
        />

        {/* Product Info */}
        <View style={styles.infoContainer}>
          {product.brand && (
            <Text
              style={[styles.brandText, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {product.brand}
            </Text>
          )}
          <Text
            style={[styles.nameText, { color: theme.textPrimary }]}
            numberOfLines={2}
          >
            {product.name}
          </Text>
          <Text style={[styles.unitText, { color: theme.textSecondary }]}>
            {product.unit}
          </Text>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.textPrimary }]}>
              ₹{product.price}
            </Text>
            {product.originalPrice && (
              <Text style={[styles.originalPrice, { color: theme.textSecondary }]}>
                ₹{product.originalPrice}
              </Text>
            )}
          </View>
        </View>

        {/* Add to Cart / Quantity Controls */}
        {product.inStock && (
          <View style={styles.cartContainer}>
            {quantity === 0 ? (
              <TouchableOpacity
                onPress={handleAddToCart}
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={[styles.addButtonText, { color: theme.badgeText }]}>
                  ADD
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.quantityControls,
                  { backgroundColor: theme.primary },
                ]}
              >
                <TouchableOpacity
                  onPress={handleDecrement}
                  style={styles.quantityButton}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Text style={[styles.quantityButtonText, { color: theme.badgeText }]}>
                    −
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.quantityText, { color: theme.badgeText }]}>
                  {quantity}
                </Text>
                <TouchableOpacity
                  onPress={handleIncrement}
                  style={styles.quantityButton}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Text style={[styles.quantityButtonText, { color: theme.badgeText }]}>
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }
);

ProductCard.displayName = 'ProductCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 8,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 9,
    fontWeight: '800',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F9FAFB',
  },
  infoContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 2,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  unitText: {
    fontSize: 10,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
  },
  originalPrice: {
    fontSize: 11,
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  cartContainer: {
    paddingHorizontal: 8,
    marginTop: 8,
  },
  addButton: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  quantityControls: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
  },
  quantityButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
});
