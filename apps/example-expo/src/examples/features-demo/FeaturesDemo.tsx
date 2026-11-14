import { useLayoutEffect, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useTheme } from '@react-navigation/native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { BottomSheet, Button, Column, Row, Spacer, Text } from '@expo/ui';
import {
  ArrangementView,
  type Arrangement,
  type ArrangementAxes,
  type HingePolicy,
  type HorizontalEdge,
  type VerticalEdge,
} from 'react-native-arrangement-view';
import { Pane } from './Pane';
import { Segments } from './Segments';

export function FeaturesDemo() {
  const [arrangement, setArrangement] = useState<Arrangement>('split');
  const [axes, setAxes] = useState<ArrangementAxes>('both');
  const [horizontalEdge, setHorizontalEdge] = useState<HorizontalEdge>();
  const [verticalEdge, setVerticalEdge] = useState<VerticalEdge>();
  const [hingePolicy, setHingePolicy] =
    useState<HingePolicy>('avoidSeparating');
  const [hingeGap, setHingeGap] = useState(24);
  const [propsShown, setPropsShown] = useState(false);
  usePropsButton(setPropsShown);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ArrangementView
        style={styles.arrangement}
        arrangement={arrangement}
        axes={axes}
        primaryEdge={
          horizontalEdge && verticalEdge
            ? [horizontalEdge, verticalEdge]
            : (horizontalEdge ?? verticalEdge)
        }
        hingePolicy={hingePolicy}
        hingeGap={hingeGap}
      >
        <ArrangementView.Primary>
          <Pane primary arrangement={arrangement} />
        </ArrangementView.Primary>
        <ArrangementView.Secondary>
          <Pane primary={false} arrangement={arrangement} />
        </ArrangementView.Secondary>
      </ArrangementView>

      <BottomSheet
        testID="props-sheet"
        isPresented={propsShown}
        onDismiss={() => setPropsShown(false)}
        snapPoints={['half', 'full']}
        containerColor="#1a1d2a"
        contentColor="white"
      >
        <Column spacing={18}>
          <Row alignment="center">
            <Text textStyle={styles.sheetTitle}>ArrangementView props</Text>
            <Spacer flexible />
            <Button
              testID="props-done"
              label="Done"
              onPress={() => setPropsShown(false)}
            />
          </Row>
          <Prop name="arrangement">
            <Segments
              testID="arrangement"
              options={[
                { value: 'split', label: 'Split' },
                { value: 'overlay', label: 'Overlay' },
              ]}
              selected={arrangement}
              onSelect={setArrangement}
            />
          </Prop>
          <Prop name="axes">
            <Segments
              testID="axes"
              options={[
                { value: 'both', label: 'Both' },
                { value: 'horizontal', label: 'Horizontal' },
                { value: 'vertical', label: 'Vertical' },
              ]}
              selected={axes}
              onSelect={setAxes}
            />
          </Prop>
          <Prop name="primaryEdge, side by side">
            <Segments
              testID="primary-edge-horizontal"
              options={[
                { value: 'default', label: 'Default' },
                { value: 'leading', label: 'Leading' },
                { value: 'trailing', label: 'Trailing' },
              ]}
              selected={horizontalEdge ?? 'default'}
              onSelect={(edge) =>
                setHorizontalEdge(edge === 'default' ? undefined : edge)
              }
            />
          </Prop>
          <Prop name="primaryEdge, stacked">
            <Segments
              testID="primary-edge-vertical"
              options={[
                { value: 'default', label: 'Default' },
                { value: 'top', label: 'Top' },
                { value: 'bottom', label: 'Bottom' },
              ]}
              selected={verticalEdge ?? 'default'}
              onSelect={(edge) =>
                setVerticalEdge(edge === 'default' ? undefined : edge)
              }
            />
          </Prop>
          {Platform.OS === 'android' && (
            <>
              <Prop name="hingePolicy">
                <Segments
                  testID="hinge-policy"
                  options={[
                    { value: 'avoidSeparating', label: 'Separating' },
                    { value: 'alwaysAvoid', label: 'Always' },
                    { value: 'neverAvoid', label: 'Never' },
                  ]}
                  selected={hingePolicy}
                  onSelect={setHingePolicy}
                />
              </Prop>
              <Prop name="hingeGap">
                <Segments
                  testID="hinge-gap"
                  options={gaps.map((gap) => ({
                    value: String(gap),
                    label: `${gap} dp`,
                  }))}
                  selected={String(hingeGap)}
                  onSelect={(gap) => setHingeGap(Number(gap))}
                />
              </Prop>
            </>
          )}
          <Spacer flexible />
        </Column>
      </BottomSheet>
    </SafeAreaView>
  );
}

const gaps = [0, 24, 80];

function Prop({ name, children }: { name: string; children: ReactNode }) {
  return (
    <Column spacing={8}>
      <Text textStyle={styles.propName}>{name}</Text>
      {children}
    </Column>
  );
}

function usePropsButton(setShown: (shown: boolean) => void) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  useLayoutEffect(() => {
    navigation.setOptions(
      Platform.OS === 'ios'
        ? {
            unstable_headerRightItems: () => [
              {
                type: 'button',
                label: 'Props',
                icon: { type: 'sfSymbol', name: 'gearshape' },
                onPress: () => setShown(true),
              },
            ],
          }
        : {
            headerRight: () => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Props"
                onPress={() => setShown(true)}
                hitSlop={8}
              >
                <MaterialDesignIcons name="cog" size={24} color={colors.text} />
              </Pressable>
            ),
          }
    );
  }, [navigation, setShown, colors.text]);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#10121a' },
  arrangement: { flex: 1, overflow: 'hidden' },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  propName: { fontSize: 14, fontWeight: '600', color: '#aab3ce' },
});
