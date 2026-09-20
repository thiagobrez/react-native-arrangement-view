import { Children, Fragment, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';

export interface ArrangementSlotProps {
  children?: ReactNode;
}

/** Content for the primary pane. Renders no view of its own. */
export function ArrangementPrimary({ children }: ArrangementSlotProps) {
  return children;
}
ArrangementPrimary.displayName = 'ArrangementView.Primary';

/** Content for the secondary pane. Renders no view of its own. */
export function ArrangementSecondary({ children }: ArrangementSlotProps) {
  return children;
}
ArrangementSecondary.displayName = 'ArrangementView.Secondary';

export interface ResolvedSlots {
  primary: ReactElement | null;
  secondary: ReactElement | null;
  /** Human-readable problems with the supplied children, for dev warnings. */
  problems: string[];
}

/**
 * Picks the Primary and Secondary slot elements out of ArrangementView's
 * children. Slots are matched by component identity, so their order does not
 * matter. Anything else is reported as a problem and ignored.
 */
export function resolveSlots(children: ReactNode): ResolvedSlots {
  const problems: string[] = [];
  let primary: ReactElement | null = null;
  let secondary: ReactElement | null = null;
  for (const child of Children.toArray(children)) {
    if (isValidElement(child) && child.type === ArrangementPrimary) {
      if (primary) {
        problems.push(
          'ArrangementView received more than one ArrangementView.Primary child; only the first is rendered.'
        );
      } else {
        primary = child;
      }
    } else if (isValidElement(child) && child.type === ArrangementSecondary) {
      if (secondary) {
        problems.push(
          'ArrangementView received more than one ArrangementView.Secondary child; only the first is rendered.'
        );
      } else {
        secondary = child;
      }
    } else {
      problems.push(
        `ArrangementView received an unexpected child (${describe(child)}). Only ArrangementView.Primary and ArrangementView.Secondary are rendered; other children are ignored.`
      );
    }
  }
  if (!primary) {
    problems.push(
      'ArrangementView is missing an ArrangementView.Primary child; the primary pane will be empty.'
    );
  }
  if (!secondary) {
    problems.push(
      'ArrangementView is missing an ArrangementView.Secondary child; the secondary pane will be empty.'
    );
  }
  return { primary, secondary, problems };
}

function describe(child: ReactNode): string {
  if (!isValidElement(child)) return `${typeof child} "${String(child)}"`;
  const type = child.type as unknown;
  if (type === Fragment) return '<Fragment>';
  if (typeof type === 'string') return `<${type}>`;
  if (typeof type === 'function' || (typeof type === 'object' && type)) {
    const named = type as { displayName?: string; name?: string };
    return `<${named.displayName ?? named.name ?? 'Anonymous'}>`;
  }
  return 'unknown element';
}

const warned = new Set<string>();

/** Warns once per distinct message, only outside production builds. */
export function warnOnce(messages: readonly string[]) {
  if (process.env.NODE_ENV === 'production') return;
  for (const message of messages) {
    if (warned.has(message)) continue;
    warned.add(message);
    console.warn(message);
  }
}
