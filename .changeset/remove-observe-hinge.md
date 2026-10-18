---
'react-native-arrangement-view': minor
---

Remove `ArrangementView`'s `observeHinge` prop. Observing the hinge was always cheap, since both platforms report only changes, and the prop never affected layout: turning it off only made `useHingeChange` and `useHingeSelector` inside the arrangement report no hinge on a device that has one. Delete the prop where you set it.
