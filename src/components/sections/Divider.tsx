import React from 'react';
import { View } from 'react-native';
import type { DividerSection, SDUIAction } from '@/types/sdui.types';
import { useTheme } from '@engine/theme/ThemeEngine';

interface DividerProps {
  section: DividerSection;
  // WHY underscore prefix: required by registry contract, unused intentionally.
  onAction: (action: SDUIAction) => void;
}

export const DividerComponent: React.FC<DividerProps> = React.memo(({ section, onAction: _onAction }) => {
  const theme = useTheme();
  return (
    <View
      style={{
        height: section.thickness ?? 1,
        backgroundColor: section.color ?? theme.borderColor,
        marginHorizontal: 16,
        marginVertical: section.marginVertical ?? 8,
      }}
    />
  );
});

DividerComponent.displayName = 'DividerComponent';
