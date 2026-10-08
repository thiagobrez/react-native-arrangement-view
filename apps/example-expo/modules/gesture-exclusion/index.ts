import type { ComponentType } from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import { requireNativeView } from 'expo';

/**
 * A View that the system's edge gestures, such as Android's back gesture,
 * leave alone. Elsewhere it is a plain View.
 */
export const GestureExclusionView: ComponentType<ViewProps> =
  Platform.OS === 'android' ? requireNativeView('GestureExclusion') : View;
