---
description: Upgrade react-native-arrangement-view from 0.5 to 0.6, where useHingeChange and useHingeSelector return null until the platform first reports the hinge.
---

# Migrating to v0.6

In 0.6, [`useHingeChange`](../api/use-hinge-change) and [`useHingeSelector`](../api/use-hinge-selector) return `null` until the platform first reports the hinge.

In 0.5, they returned `{ available: false, angle: null, status: 'unknown' }` until the first report, the same state as a device without a hinge. Now that state means there is no hinge, and `null` means there is no report yet. [When the first report comes](../api/use-hinge-change#when-the-first-report-comes) depends on the platform.

Both hooks' return types now include `null`, so TypeScript flags each read that needs a change.

## useHingeChange

The hook returns `HingeState | null`. Read the fields with optional chaining:

```diff
- const halfOpen = hinge.status === 'partiallyOpen';
+ const halfOpen = hinge?.status === 'partiallyOpen';
```

The callback no longer runs for the state before the first report. Its first call is the first report.

## useHingeSelector

The hook returns `null` until the first report, and calls the selector only with a report. Where the result must be a boolean, give the `null` a value:

```diff
- const tabletop = useHingeSelector((hinge) => hinge.status === 'partiallyOpen');
+ const tabletop =
+   useHingeSelector((hinge) => hinge.status === 'partiallyOpen') ?? false;
```
