import React from 'react';
import { View } from 'react-native';
import type { SpacerSection, SDUIAction } from '@/types/sdui.types';

interface SpacerProps {
  section: SpacerSection;
  // WHY underscore prefix: onAction is required by RegistryComponent<T> interface
  // but Spacer has no interactive elements. Prefix signals intentional non-use
  // to TypeScript strict mode without disabling the lint rule.
  onAction: (action: SDUIAction) => void;
}

export const SpacerComponent: React.FC<SpacerProps> = React.memo(({ section, onAction: _onAction }) => (
  <View style={{ height: section.height }} />
));

SpacerComponent.displayName = 'SpacerComponent';
