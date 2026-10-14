# useArrangementLayout

Call the hook **inside a component rendered in either pane**. It returns what the nearest [`ArrangementView`](./arrangement-view) shows, and re-renders when that changes, so a pane can adapt to its sibling: for example, hide a button that opens the secondary pane while the secondary pane is already on screen.

```tsx
import { useArrangementLayout } from 'react-native-arrangement-view';

function Dashboard() {
  const layout = useArrangementLayout((next) => {
    // Called with each known layout, as it changes.
    console.log(next.secondaryVisible, next.axis);
  });

  return <Rail showCalendarButton={!layout?.secondaryVisible} />;
}
```

The callback is optional; the hook also returns the current `ArrangementLayout` and subscribes the component to updates.

The layout is `null` until the panes are first laid out, so content that depends on it can wait rather than flash. It describes the panes' placement, not the hinge: a device unfolded with only the primary pane on screen, such as in a multi-window split, reports `secondaryVisible: false`.

To observe the layout from outside the panes, use `ArrangementView`'s `onArrangementLayoutChange` prop. It receives the same values without re-rendering the arrangement.

## ArrangementLayout

```ts
type ArrangementLayout = {
  secondaryVisible: boolean; // beside the primary pane, or behind it in overlay
  axis: 'horizontal' | 'vertical' | null; // null when only the primary shows or the panes overlap
  isOverlapping: boolean; // both on screen, the primary in front
};
```

| On screen                               | `secondaryVisible` | `axis`                         | `isOverlapping` |
| --------------------------------------- | ------------------ | ------------------------------ | --------------- |
| The primary pane only                   | `false`            | `null`                         | `false`         |
| Split side by side, or stacked          | `true`             | `"horizontal"` or `"vertical"` | `false`         |
| Overlay, the panes on top of each other | `true`             | `null`                         | `true`          |
| Overlay, separated by a hinge           | `true`             | `"horizontal"` or `"vertical"` | `false`         |

In the iOS [fallback](../guide/how-panes-are-arranged#fallback), the layout reports the primary pane only for `split`, and overlapping panes for `overlay`.
