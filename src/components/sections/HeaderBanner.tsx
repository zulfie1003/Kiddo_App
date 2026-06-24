import React, { useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { HeaderBannerSection, SDUIAction } from '@/types/sdui.types';
import { useTheme } from '@engine/theme/ThemeEngine';

interface HeaderBannerProps {
  section: HeaderBannerSection;
  onAction: (action: SDUIAction) => void;
}

export const HeaderBannerComponent: React.FC<HeaderBannerProps> = React.memo(
  ({ section, onAction }) => {
    const theme = useTheme();

    const handlePress = useCallback(() => {
      if (section.action) {
        onAction(section.action);
      }
    }, [section.action, onAction]);

    const bg = section.backgroundColor ?? theme.primary;
    const textColor = section.textColor ?? theme.badgeText;

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={section.action ? 0.85 : 1}
        style={[styles.container, { backgroundColor: bg }]}
      >
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: textColor }]}>{section.title}</Text>
          {section.subtitle && (
            <Text style={[styles.subtitle, { color: textColor }]}>{section.subtitle}</Text>
          )}
        </View>
        {section.imageUrl && (
          <Image
            source={{ uri: section.imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
    );
  }
);

HeaderBannerComponent.displayName = 'HeaderBannerComponent';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 80,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.85,
  },
  image: {
    width: 80,
    height: 80,
    marginLeft: 12,
  },
});
