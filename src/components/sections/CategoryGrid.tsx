import React, { useCallback } from 'react';
import type { ListRenderItemInfo } from 'react-native';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, Dimensions } from 'react-native';
import type { CategoryGridSection, SDUIAction } from '@/types/sdui.types';
import { useTheme } from '@engine/theme/ThemeEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CategoryItem = CategoryGridSection['categories'][number];

interface CategoryGridProps {
  section: CategoryGridSection;
  onAction: (action: SDUIAction) => void;
}

const CategoryTile: React.FC<{ item: CategoryItem; size: number; onAction: (a: SDUIAction) => void }> = React.memo(
  ({ item, size, onAction }) => {
    const theme = useTheme();

    const handlePress = useCallback(() => {
      onAction(item.action);
    }, [item.action, onAction]);

    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.tile, { width: size, backgroundColor: item.backgroundColor ?? theme.surface, borderColor: theme.borderColor }]}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.tileImage} resizeMode="contain" />
        <Text style={[styles.tileName, { color: theme.textPrimary }]} numberOfLines={2}>{item.name}</Text>
      </TouchableOpacity>
    );
  }
);

CategoryTile.displayName = 'CategoryTile';

export const CategoryGridComponent: React.FC<CategoryGridProps> = React.memo(({ section, onAction }) => {
  const theme = useTheme();
  const cols = section.columns;
  const tileSize = (SCREEN_WIDTH - 32 - (cols - 1) * 8) / cols;

  const renderItem = useCallback(({ item }: ListRenderItemInfo<CategoryItem>) => (
    <CategoryTile item={item} size={tileSize} onAction={onAction} />
  ), [tileSize, onAction]);

  const keyExtractor = useCallback((item: CategoryItem) => `cat-${section.id}-${item.id}`, [section.id]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{section.title}</Text>
      <FlatList
        data={section.categories}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={cols}
        scrollEnabled={false}
        columnWrapperStyle={cols > 1 ? styles.row : undefined}
        contentContainerStyle={styles.content}
      />
    </View>
  );
});

CategoryGridComponent.displayName = 'CategoryGridComponent';

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  title: { fontSize: 18, fontWeight: '800', paddingHorizontal: 16, marginBottom: 12 },
  content: { paddingHorizontal: 16 },
  row: { gap: 8, marginBottom: 8 },
  tile: { borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center', justifyContent: 'center', gap: 6 },
  tileImage: { width: 56, height: 56 },
  tileName: { fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 15 },
});
