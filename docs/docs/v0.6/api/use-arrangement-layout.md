---
description: useArrangementLayout tells a React Native component whether the secondary pane is on screen, and whether the panes are side by side, stacked or overlapping.
---

# useArrangementLayout

A hook that returns the current [`ArrangementLayout`](./use-arrangement-layout#arrangementlayout) and subscribes the component to updates. It is useful for adapting a pane's content to what the arrangement shows, such as whether the secondary pane is on screen.

Call the hook inside an [`ArrangementView`](./arrangement-view). It returns what the nearest arrangement shows, and re-renders when that changes, so a pane can adapt to its sibling: for example, hide a button that opens the secondary pane while the secondary pane is already on screen.

```tsx
import { useArrangementLayout } from 'react-native-arrangement-view';

function Dashboard() {
  const layout = useArrangementLayout();

  return <Tabs showCalendarButton={!layout?.secondaryVisible} />;
}
```

To observe the layout from outside the panes, use `ArrangementView`'s `onArrangementLayoutChange` prop. It receives the same values without re-rendering the arrangement.

## ArrangementLayout

The layout is `null` until the panes are first laid out.

- `secondaryVisible` is `true` when the secondary pane is on screen, either beside or behind the primary pane.
- `axis` is `"horizontal"` or `"vertical"` when the panes are side by side or stacked, and `null` when only the primary pane shows or the panes overlap.
- `isOverlapping` is `true` when both panes are on screen and the primary pane is in front of the secondary pane, in the `overlay` arrangement.

```ts
type ArrangementLayout = {
  secondaryVisible: boolean;
  axis: 'horizontal' | 'vertical' | null;
  isOverlapping: boolean;
};
```

| On screen                               | `secondaryVisible` | `axis`                         | `isOverlapping` |
| --------------------------------------- | ------------------ | ------------------------------ | --------------- |
| The primary pane only                   | `false`            | `null`                         | `false`         |
| Split side by side, or stacked          | `true`             | `"horizontal"` or `"vertical"` | `false`         |
| Overlay, the panes on top of each other | `true`             | `null`                         | `true`          |
| Overlay, separated by a hinge           | `true`             | `"horizontal"` or `"vertical"` | `false`         |

In the iOS [fallback](../guide/how-panes-are-arranged#fallback), the layout reports the primary pane only for `split`, and overlapping panes for `overlay`.
