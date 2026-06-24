/**
 * CART BADGE — Isolated Rerender Demo
 *
 * This component demonstrates Zustand's isolated rerender in practice.
 *
 * SUBSCRIPTION: cartCountSelector
 * RERENDERS WHEN: cart count changes
 * DOES NOT RERENDER: banner, collections, other products, homepage layout
 *
 * This is the ONLY component that renders the cart count.
 * Placing it in the header means the header re-renders just its
 * badge number, NOT the entire homepage.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCartStore, cartCountSelector } from '@store/CartStore';
import { useTheme } from '@engine/theme/ThemeEngine';
import { useActionDispatcher } from '@engine/action/ActionDispatcher';

export const CartBadge: React.FC = React.memo(() => {
  const count = useCartStore(cartCountSelector);
  const theme = useTheme();
  const { dispatch } = useActionDispatcher();

  const handlePress = (): void => {
    dispatch({
      type: 'DEEP_LINK',
      payload: { url: '/cart' },
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Text style={[styles.icon, { color: theme.textPrimary }]}>🛒</Text>
      {count > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
          <Text style={[styles.count, { color: theme.badgeText }]}>
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

CartBadge.displayName = 'CartBadge';

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  count: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 18,
  },
});
