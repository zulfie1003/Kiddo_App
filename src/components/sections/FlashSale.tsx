import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ListRenderItemInfo } from '@shopify/flash-list';
import { FlashList } from '@shopify/flash-list';
import type { FlashSaleSection, SDUIProduct, SDUIAction } from '@/types/sdui.types';
import { useTheme } from '@engine/theme/ThemeEngine';
import { ProductCard } from '@components/common/ProductCard';

interface CountdownProps {
  endsAtMs: number;
  color: string;
}

const Countdown: React.FC<CountdownProps> = React.memo(({ endsAtMs, color }) => {
  const [remaining, setRemaining] = useState(Math.max(0, endsAtMs - Date.now()));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(Math.max(0, endsAtMs - Date.now()));
    }, 1000);
    return (): void => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [endsAtMs]);

  const hours = Math.floor(remaining / 3600000).toString().padStart(2, '0');
  const mins = Math.floor((remaining % 3600000) / 60000).toString().padStart(2, '0');
  const secs = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');

  return (
    <Text style={[styles.countdown, { color }]}>⏱ {hours}:{mins}:{secs}</Text>
  );
});

Countdown.displayName = 'Countdown';

interface FlashSaleProps {
  section: FlashSaleSection;
  onAction: (action: SDUIAction) => void;
}

export const FlashSaleComponent: React.FC<FlashSaleProps> = React.memo(({ section, onAction }) => {
  const theme = useTheme();
  const badgeColor = section.badgeColor ?? '#DC2626';

  const renderProduct = useCallback(
    ({ item }: ListRenderItemInfo<SDUIProduct>) => (
      <View style={styles.cardWrap}>
        <ProductCard product={item} onAction={onAction} cardWidth={140} />
      </View>
    ), [onAction]);

  const keyExtractor = useCallback((item: SDUIProduct) => `flash-${section.id}-${item.id}`, [section.id]);

  return (
    <View style={[styles.container, { backgroundColor: badgeColor + '12' }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>⚡ FLASH SALE</Text>
        </View>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{section.title}</Text>
        <Countdown endsAtMs={section.endsAtMs} color={badgeColor} />
      </View>
      <FlashList
        data={section.products}
        renderItem={renderProduct}
        keyExtractor={keyExtractor}
        horizontal
        estimatedItemSize={148}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews
      />
    </View>
  );
});

FlashSaleComponent.displayName = 'FlashSaleComponent';

const styles = StyleSheet.create({
  container: { marginVertical: 8, paddingVertical: 12 },
  header: { paddingHorizontal: 16, marginBottom: 12, gap: 6 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 18, fontWeight: '800' },
  countdown: { fontSize: 14, fontWeight: '700' },
  listContent: { paddingLeft: 16, paddingRight: 8 },
  cardWrap: { marginRight: 8 },
});
