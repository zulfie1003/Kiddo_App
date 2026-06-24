/**
 * BANNER HERO COMPONENT
 *
 * WHY React.memo:
 * BannerHero is passed `section` and `onAction` props.
 * Without memo, every outer FlashList render (e.g., scroll event)
 * would re-render BannerHero even if its props didn't change.
 * React.memo prevents this by shallow-comparing props.
 *
 * WHY HORIZONTAL FLATLIST (not FlashList) for banners:
 * The banner list is typically 3-5 items max. FlashList's recycling
 * optimization is most valuable for 20+ items. For small lists,
 * the overhead of FlashList setup outweighs benefits.
 * Horizontal ScrollView or FlatList is adequate here.
 *
 * WHY aspectRatio in SDUIBanner:
 * Without a pre-defined aspect ratio, the Image component renders
 * at 0 height until the image loads, causing a layout shift.
 * Backend provides the aspect ratio → we pre-allocate the space.
 */

import React, { useCallback, useState } from 'react';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ListRenderItemInfo} from 'react-native';
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions
} from 'react-native';

import type { BannerHeroSection, SDUIBanner, SDUIAction } from '@/types/sdui.types';
import { useTheme } from '@engine/theme/ThemeEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BannerHeroProps {
  section: BannerHeroSection;
  onAction: (action: SDUIAction) => void;
}

// ─────────────────────────────────────────────
// BANNER ITEM — Memoized individually
// WHY: If banner list has 5 items, only the changed banner rerenders
// ─────────────────────────────────────────────

interface BannerItemProps {
  banner: SDUIBanner;
  onAction: (action: SDUIAction) => void;
  width: number;
}

const BannerItem: React.FC<BannerItemProps> = React.memo(
  ({ banner, onAction, width }) => {
    const theme = useTheme();
    const imageHeight = width / banner.aspectRatio;

    const handlePress = useCallback(() => {
      if (banner.ctaAction) {
        onAction(banner.ctaAction);
      }
    }, [banner.ctaAction, onAction]);

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.95}
        style={[styles.bannerItem, { width }]}
      >
        <Image
          source={{ uri: banner.imageUrl }}
          style={[styles.bannerImage, { height: imageHeight }]}
          resizeMode="cover"
        />
        {(banner.title || banner.subtitle) && (
          <View
            style={[
              styles.bannerOverlay,
              { backgroundColor: banner.backgroundColor ?? 'rgba(0,0,0,0.3)' },
            ]}
          >
            {banner.title && (
              <Text style={[styles.bannerTitle, { color: theme.surface }]}>
                {banner.title}
              </Text>
            )}
            {banner.subtitle && (
              <Text style={[styles.bannerSubtitle, { color: theme.surface }]}>
                {banner.subtitle}
              </Text>
            )}
            {banner.ctaText && (
              <View style={[styles.ctaButton, { backgroundColor: theme.primary }]}>
                <Text style={[styles.ctaText, { color: theme.badgeText }]}>
                  {banner.ctaText}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }
);

BannerItem.displayName = 'BannerItem';

// ─────────────────────────────────────────────
// BANNER HERO
// ─────────────────────────────────────────────

export const BannerHeroComponent: React.FC<BannerHeroProps> = React.memo(
  ({ section, onAction }) => {
    const theme = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);
    const bannerWidth = SCREEN_WIDTH - 32; // 16px padding each side

    const renderBanner = useCallback(
      ({ item }: ListRenderItemInfo<SDUIBanner>) => (
        <BannerItem banner={item} onAction={onAction} width={bannerWidth} />
      ),
      [onAction, bannerWidth]
    );

    const keyExtractor = useCallback((item: SDUIBanner) => item.id, []);

    const handleScroll = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / bannerWidth);
        setActiveIndex(index);
      },
      [bannerWidth]
    );

    return (
      <View style={styles.container}>
        <FlatList
          data={section.banners}
          renderItem={renderBanner}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          snapToInterval={bannerWidth + 12}
          decelerationRate="fast"
          contentContainerStyle={styles.listContent}
        />
        {section.showDots && section.banners.length > 1 && (
          <View style={styles.dotsContainer}>
            {section.banners.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === activeIndex ? theme.primary : theme.borderColor,
                    width: index === activeIndex ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  }
);

BannerHeroComponent.displayName = 'BannerHeroComponent';

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  bannerItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
    opacity: 0.9,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
