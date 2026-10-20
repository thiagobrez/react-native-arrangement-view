import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { colors } from './data';

type HeaderItem = ReturnType<
  NonNullable<NativeStackNavigationOptions['unstable_headerRightItems']>
>[number];
type SFSymbolName = Extract<
  NonNullable<Extract<HeaderItem, { type: 'button' }>['icon']>,
  { type: 'sfSymbol' }
>['name'];

export interface HeaderButton {
  label: string;
  sfSymbol: SFSymbolName;
  materialIcon: ComponentProps<typeof MaterialDesignIcons>['name'];
  tint?: string;
  onPress?: () => void;
}

export const headerBase: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

export function headerButtons(
  buttons: HeaderButton[]
): NativeStackNavigationOptions {
  return Platform.OS === 'ios'
    ? {
        unstable_headerRightItems: () =>
          buttons.map((button) => ({
            type: 'button',
            label: button.label,
            icon: { type: 'sfSymbol', name: button.sfSymbol },
            tintColor: button.tint,
            onPress: button.onPress ?? (() => {}),
          })),
      }
    : {
        headerRight: () => (
          <View style={styles.buttons}>
            {buttons.map((button) => (
              <Pressable
                key={button.label}
                accessibilityRole="button"
                accessibilityLabel={button.label}
                onPress={button.onPress}
                hitSlop={8}
              >
                <MaterialDesignIcons
                  name={button.materialIcon}
                  size={24}
                  color={button.tint ?? colors.text}
                />
              </Pressable>
            ))}
          </View>
        ),
      };
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', gap: 18 },
});
