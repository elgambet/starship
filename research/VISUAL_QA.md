# Visual review of the first Three.js render

Review date: 15 November 2026. The user supplied two Desktop screenshots for direct comparison. Copies are archived here: [initial local exterior](qa/initial-exterior-screenshot.png) and [SpaceX/NASA concept-art crop](qa/reference-crop-screenshot.png). The second file is a crop of reference artwork, not a photograph or a dimensioned drawing; its underlying rights remain with its creator. The full source art and credit are recorded in [IMAGE_SOURCES.md](IMAGE_SOURCES.md).

## Findings from the comparison

The initial local image was an inadequate presentation render. Its upper vehicle was a short plain cone above a white cylinder; the reference has a softer tapered nose and a much stronger dark cabin band. The initial body had a row of pale rectangular windows but lacked the broad dark glazing, visible panel hierarchy, flag/NASA markings and soft material transitions in the concept art. The lower body ended in repeated black slots and thin rods, while the reference shows a cleaner white skirt, recessed bays, heavier fairings and angled legs. The ground was almost uniformly gray and flat. The initial viewing distance also made the 52 m vehicle too small in the viewport. Separately, the cutaway mode was functionally broken because an interior front wall stayed visible after the exterior front wall was hidden.

## Corrections made in the local viewer

- Replaced the upper white body treatment with a dark cabin collar, separate small upper windows and broad lower glazing. The window placements are still design estimates.
- Rounded the nose profile with more radial control points and adjusted the default exterior camera to a near-front angle.
- Added a transparent vector-style flag/NASA decal beneath the dark collar, improved the leg root fairings and removed the repeated black lower slots.
- Reduced flat ambient illumination, added restrained dark-collar seams and generated stronger lunar regolith variation and distant low terrain relief. These maps are created locally at runtime.
- Hid the front **inner** shell together with the front outer shell in cutaway mode. The four levels and central stair are now actually visible from the section preset.
- Moved room labels into a separate close-range group, removed default measurement guides and adjusted deck camera distances so labels no longer dominate the full-ship render.

The revised viewer remains a **stylized, real-time spatial model**. It is materially closer to the exterior concept in silhouette and color grouping, and its interior section is inspectable. It is **not** a photoreal recreation of SpaceX's polished image. A separate art pass would require detailed geometry for hull interfaces, authentic panel and window design, PBR materials, higher fidelity terrain, controlled reflections and deliberate lighting. Those unpublished design details would still be estimates.

Run `npm run dev` from the project root to inspect the latest viewer. Use the **Full ship**, **Section**, and **Deck A–D** presets for visual review. The source screenshots in `qa/` are historical comparison evidence, not texture assets for the model.
