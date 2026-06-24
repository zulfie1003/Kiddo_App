/**
 * CART STORE — Zustand
 *
 * WHY ZUSTAND OVER REDUX:
 * Redux requires actions, reducers, selectors, and a provider tree.
 * Zustand gives the same guarantees with 80% less boilerplate.
 * For a cart use case, Zustand is the correct tool.
 *
 * WHY ISOLATED RERENDERS:
 * This is the most critical performance requirement:
 * "Adding product from one card MUST NOT rerender homepage, banners,
 *  collections, or other products."
 *
 * HOW:
 * - `useCartStore(s => s.count)` — subscribes ONLY to count
 * - When count changes, only this subscriber rerenders
 * - `useCartStore(s => s.items)` — different subscriber, isolated
 *
 * PROOF:
 * Zustand uses a subscription model. Each `useCartStore(selector)`
 * call creates an independent subscription. The store batches updates
 * via React 18's automatic batching. Only subscriptions whose
 * selected value changed are notified.
 *
 * CONTRAST WITH CONTEXT:
 * React Context rerenders ALL consumers when value changes.
 * Zustand rerenders ONLY subscribers whose selected slice changed.
 * This is why Zustand (not Context) is used for cart state.
 */

import { create } from 'zustand';
import type { CartState, CartItem } from '@/types/sdui.types';

// ─────────────────────────────────────────────
// COMPUTED HELPERS
// WHY: Pure functions for derived state. Recomputed only when
// `items` changes, not on every store mutation.
// ─────────────────────────────────────────────

function computeCount(items: Record<string, CartItem>): number {
  return Object.values(items).reduce((sum, item) => sum + item.quantity, 0);
}

function computeTotalPrice(items: Record<string, CartItem>): number {
  return Object.values(items).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
}

// ─────────────────────────────────────────────
// STORE DEFINITION
// ─────────────────────────────────────────────

export const useCartStore = create<CartState>((set) => ({
  items: {},
  count: 0,
  totalPrice: 0,

  /**
   * WHY set() with a function:
   * Zustand's set() with a function provides the current state.
   * This prevents race conditions when multiple items are added
   * rapidly (e.g., bulk add from a collection).
   */
  addToCart: (product): void => {
    set((state) => {
      const existing = state.items[product.id];
      const quantity = (product.quantity ?? 1);

      const updatedItems: Record<string, CartItem> = {
        ...state.items,
        [product.id]: existing
          ? { ...existing, quantity: existing.quantity + quantity }
          : {
              id: product.id,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              quantity,
            },
      };

      return {
        items: updatedItems,
        count: computeCount(updatedItems),
        totalPrice: computeTotalPrice(updatedItems),
      };
    });
  },

  removeFromCart: (id): void => {
    set((state) => {
      const { [id]: _removed, ...remainingItems } = state.items;

      return {
        items: remainingItems,
        count: computeCount(remainingItems),
        totalPrice: computeTotalPrice(remainingItems),
      };
    });
  },

  incrementQuantity: (id): void => {
    set((state) => {
      const item = state.items[id];
      if (!item) return state;

      const updatedItems = {
        ...state.items,
        [id]: { ...item, quantity: item.quantity + 1 },
      };

      return {
        items: updatedItems,
        count: computeCount(updatedItems),
        totalPrice: computeTotalPrice(updatedItems),
      };
    });
  },

  decrementQuantity: (id): void => {
    set((state) => {
      const item = state.items[id];
      if (!item) return state;

      if (item.quantity <= 1) {
        // Remove item when quantity reaches 0
        const { [id]: _removed, ...remainingItems } = state.items;
        return {
          items: remainingItems,
          count: computeCount(remainingItems),
          totalPrice: computeTotalPrice(remainingItems),
        };
      }

      const updatedItems = {
        ...state.items,
        [id]: { ...item, quantity: item.quantity - 1 },
      };

      return {
        items: updatedItems,
        count: computeCount(updatedItems),
        totalPrice: computeTotalPrice(updatedItems),
      };
    });
  },

  clearCart: (): void => {
    set({ items: {}, count: 0, totalPrice: 0 });
  },
}));

// ─────────────────────────────────────────────
// SELECTORS
// WHY: Pre-defined selectors are stable function references.
// Inline selectors `s => s.count` create new functions on each call.
// Stable selectors can be memoized externally.
// ─────────────────────────────────────────────

export const cartCountSelector = (s: CartState): number => s.count;
export const cartTotalPriceSelector = (s: CartState): number => s.totalPrice;
export const cartItemsSelector = (s: CartState): Record<string, CartItem> => s.items;

/**
 * Selector for a specific product's quantity.
 * WHY factory function: Each product needs its own selector.
 * This is a "selector factory" — a function that returns a selector.
 *
 * Usage:
 *   const qty = useCartStore(cartItemQuantitySelector('product-123'));
 *
 * WHY this works for isolated rerenders:
 * The ProductCard for product-123 subscribes only to the quantity
 * of product-123. Adding product-456 to cart does NOT trigger
 * this selector because `items['123']?.quantity` didn't change.
 */
export const cartItemQuantitySelector = (productId: string) =>
  (s: CartState): number => s.items[productId]?.quantity ?? 0;

/**
 * DEMONSTRATION OF ISOLATED RERENDERS:
 *
 * Component A: const count = useCartStore(cartCountSelector)
 * Component B: const qty = useCartStore(cartItemQuantitySelector('prod-1'))
 * Component C: const qty = useCartStore(cartItemQuantitySelector('prod-2'))
 *
 * Action: Add prod-2 to cart
 * Result:
 *   - Component A rerenders (count changed: 0 → 1)
 *   - Component B does NOT rerender (prod-1 quantity unchanged)
 *   - Component C rerenders (prod-2 quantity changed: 0 → 1)
 *   - HomepageRenderer does NOT rerender (not subscribed to cart)
 *   - BannerHero does NOT rerender (not subscribed to cart)
 *   - Other ProductCards do NOT rerender (their quantities unchanged)
 *
 * This is the key performance advantage of Zustand selectors.
 */
