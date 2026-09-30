# Hardware Quest — Interactive Repair Bay

## Gameplay change

Mission 02 now takes place at a visual PC repair bench rather than a grid of toggle cards:

- Components appear seated in an open computer chassis; removed parts move to a green anti-static inspection mat.
- Players press and drag a part between the chassis and mat. A floating close-up follows the pointer/finger, and the part changes location only when released over the correct work area.
- Tapping a part selects it in the macro inspector. The inspector shows its component illustration, hardware category, installed state, and the result of removing it.
- The inspector also includes explicit remove/reinstall controls, so the core action does not depend on precise dragging.
- Existing system-failure simulation, evidence collection, repair tickets, scoring, and learning outcome remain connected to the new workbench.

## Interaction/accessibility notes

- Pointer interactions support mouse and touch; drag targets are the large chassis/mat regions rather than small slots.
- Parts remain focusable buttons with labels; the inspector's regular button provides a non-drag alternative.
- The scene reuses the project's vector hardware illustrations and Lucide icons; no external image dependency was added.

## Verification

Run `npm.cmd run lint` and `npm.cmd run build` from the project folder.
