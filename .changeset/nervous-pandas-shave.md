---
'react-native-arrangement-view': minor
---

`HingeState` gains `fold`: the rect where the system divides the window, or `null` while nothing divides it. It is non-null while a folding screen is half-open with the window across the fold, or whenever the window spans a hinge between two screens, and `null` flat, closed, or when the window sits on one side of the fold. The rect is in the window coordinates `measureInWindow` uses, and is what each platform reserves for the fold: a line, `0` wide or tall, on a folding screen's Android fold; the division band iOS reserves, Apple's 20 pt touch margin on each side included; the visible band for a hinge between two screens. `Fold` is exported as a type.

`useHingeSelector` now accepts `hinge.fold` as a return value. The library keeps one `Fold` object until the rect moves, so a component that selects it renders when the fold moves, not at every angle.
