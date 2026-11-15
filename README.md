# Starship HLS: physical reference for a Three.js model

> **About this project.** This is a personal, open-source project released under the [MIT License](LICENSE). It was built by directing two AI models, **GPT-5.6 Sol** (high reasoning) and **Claude Opus 5.5** (medium reasoning), and it makes no statement for or against using these tools. It is simply one person bringing together two passions: software and space.
>
> I did not write this code; I guided the models that did. Feel free to use, modify and share it however you like.
>
> The MIT License covers the code and documentation in this repository. The NASA model and texture, and the reference images in `research/`, keep their own terms (see *Third-party assets* and *Local visual references* below).

## Run the visual model

```bash
npm install
npm run dev
```

Open the local address printed by Vite. `npm run build` creates the production bundle in `dist/`.

### Deploy to GitHub Pages

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) builds the site on every push and pull request, and deploys it to GitHub Pages on `main`. One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The site is then served at `https://<user>.github.io/<repo>/`. The Vite base is relative ([`vite.config.js`](vite.config.js)), so the same build works at any path; set `VITE_BASE` to force an absolute one.

## Scope and current design context

The target is **SpaceX Starship Human Landing System (HLS)**, the lunar lander derived from the Starship upper stage. It is the approximately 52 m ship, **not** the approximately 124 m Starship + Super Heavy launch stack. The lander has a crew cabin near the nose, two airlocks below it, an adjacent unpressurized garage/elevator area, propellant tanks below, and landing hardware at the base. The present HLS concept is an evolving design, so illustrations are references rather than engineering drawings. [SpaceX vehicle data](https://www.spacex.com/vehicles/starship), [NASA HLS engineer interview](https://www.nasa.gov/podcasts/houston-we-have-a-podcast/artemis-iii-paving-the-way-to-lunar-landings/), [NASA airlock test](https://www.nasa.gov/directorates/esdmd/artemis-campaign-development-division/human-landing-system-program/nasa-astronauts-practice-next-giant-leap-for-artemis/).

The Artemis mission plan changed after many older renders and articles were published. As of October 2026, Artemis III is a **2027 Earth-orbit docking demonstration**. Astronauts will not enter the Starship test article on that mission; NASA is targeting an initial crewed lunar landing in 2028 and has not assigned the landing to either provider. NASA also added two ground demonstrations for the HLS crew cabin named **Cabin 1**. The model in this project should depict the **crewed lunar-landing concept**, not the stripped-down Artemis III docking test article. [NASA Artemis III test description](https://www.nasa.gov/directorates/esdmd/artemis-campaign-development-division/human-landing-system-program/how-nasas-artemis-iii-lander-test-will-pave-way-for-moon-landings/), [NASA October 2026 plan](https://www.nasa.gov/missions/artemis/nasa-partners-accelerate-lander-development-for-2028-moon-missions/).

## Measurements with usable provenance

| Feature | Published value | Confidence and interpretation | Source |
| --- | ---: | --- | --- |
| HLS height | **50 m** in a 2024 NASA Engineering presentation; **about 52 m / 171 ft** in 2026 NASA material | High for approximate total height; use **52 m as the initial model baseline** and retain 50 m as an earlier concept value. Neither is a released tolerance drawing. | [NASA Engineering 2024 slide](https://ntrs.nasa.gov/api/citations/20240011013/downloads/Artemis%20Status%202024%20240826.pdf), [NASA 2026 HLS test](https://www.nasa.gov/directorates/esdmd/artemis-campaign-development-division/human-landing-system-program/how-nasas-artemis-iii-lander-test-will-pave-way-for-moon-landings/), [NASA OIG 2026](https://oig.nasa.gov/wp-content/uploads/2026/03/final-report-ig-26-004-nasas-management-of-the-human-landing-system-contracts.pdf) |
| HLS body outside diameter | **9 m** | High for nominal cylindrical hull diameter. This excludes the deployed landing-leg footprint and elevator projection. | [NASA Engineering 2024 slide](https://ntrs.nasa.gov/api/citations/20240011013/downloads/Artemis%20Status%202024%20240826.pdf), [SpaceX Starship specifications](https://www.spacex.com/vehicles/starship) |
| Pressure cabin + airlocks | **More than 600 m³** habitable pressurized volume | High as a public claim; this is **volume**, not an interior diameter or a room-by-room plan. A NASA HLS engineer independently described about 22,000 ft³ (about 623 m³). | [SpaceX Moon page](https://www.spacex.com/humanspaceflight/moon), [NASA HLS engineer interview](https://www.nasa.gov/podcasts/houston-we-have-a-podcast/artemis-iii-paving-the-way-to-lunar-landings/) |
| Airlocks | **Two**, approximately **13 m³ each** | High for count and approximate volume; their length, width, height, hatch size and exact placement have not been published. The two volumes total about 26 m³; avoid treating all 600 m³ as one open room. | [SpaceX HLS update](https://www.spacex.com/updates), [SpaceX Moon page](https://www.spacex.com/humanspaceflight/moon) |
| Elevator boarding height | Approximately **115 ft = 35.1 m above the lunar ground** | Medium-high; NASA OIG describes the elevator position just below the crew compartment. This is an approximate boarding level, not the cabin floor elevation or exact travel distance. | [NASA OIG 2026, p. 25](https://oig.nasa.gov/wp-content/uploads/2026/03/final-report-ig-26-004-nasas-management-of-the-human-landing-system-contracts.pdf) |
| Upper/payload region in an older diagram | Approximately **22 m** of a **50 m** vehicle | Low for the current design. The 2024 NTRS slide adapts an earlier conceptual vehicle; the 22 m includes the upper vehicle zone and must **not** be used as a measured habitable-cabin height. | [NASA NTRS 2024 slide 3](https://ntrs.nasa.gov/api/citations/20240012057/downloads/MST_2024_KY_v1.pdf) |

Useful scale check, **not a cabin measurement**: a 9 m diameter circle has area about 63.6 m²; 600 m³ would occupy about 9.4 m of an ideal full-width cylinder. The real pressurized volume has wall clearance, equipment, deck partitions, airlocks and nose curvature. No published inner diameter or pressure-shell thickness was found, so this calculation cannot define the actual deck heights.

## Exterior: what can be modeled now

- **Overall silhouette:** a long, nominally 9 m cylindrical body and tapered/rounded nose, approximately 52 m tall on the lunar surface. White/light exterior, dark window bands, a small top docking interface, and landing legs are visible in published illustrations. Model the white exterior as a visual treatment, not as proof of the exact structural material or coating stack. [NASA 2024 exterior concepts](https://www.nasa.gov/directorates/esdmd/artemis-campaign-development-division/human-landing-system-program/nasa-spacex-illustrate-key-moments-of-artemis-lunar-lander-mission/), [NASA OIG comparison](https://oig.nasa.gov/wp-content/uploads/2026/03/final-report-ig-26-004-nasas-management-of-the-human-landing-system-contracts.pdf).
- **Upper section:** window groups are visible near the crew stations. The count, exact shapes, size, azimuth and elevation differ between artwork and have not been released as build dimensions. The docking port is at the nose for Orion operations. [SpaceX cabin render](https://www.spacex.com/humanspaceflight/moon), [NASA 2026 docking article](https://www.nasa.gov/directorates/esdmd/artemis-campaign-development-division/human-landing-system-program/how-nasas-artemis-iii-lander-test-will-pave-way-for-moon-landings/).
- **Mid/lower section:** exterior concepts show an elevator path along the hull, lower landing legs/footpads and aft propulsion region. NASA confirms the airlock-to-elevator route and a descending elevator for crew and cargo. Exact guide-rail offset, platform dimensions, leg span, stroke, engine layout and tank bulkhead positions are **not public HLS dimensions**. [NASA EVA mockup report](https://www.nasa.gov/directorates/esdmd/artemis-campaign-development-division/human-landing-system-program/nasa-astronauts-practice-next-giant-leap-for-artemis/), [NASA OIG 2026](https://oig.nasa.gov/wp-content/uploads/2026/03/final-report-ig-26-004-nasas-management-of-the-human-landing-system-contracts.pdf).
- **Variant caution:** standard orbital Starship flap/heat-shield details, engine specifications and propellant capacities should not automatically be copied onto HLS. NASA describes HLS-specific landing legs, insulation/paint, docking adapters, elevator and garage. [NASA HLS engineer interview](https://www.nasa.gov/podcasts/houston-we-have-a-podcast/artemis-iii-paving-the-way-to-lunar-landings/).

## Interior: known relationships and visible detail

The reliable vertical relationship is **nose docking interface → crew cabin / window area → airlock deck with two pressurized airlocks → unpressurized garage/elevator access → propellant/engine region → lunar surface**. A NASA HLS engineer describes the cabin at the top, two airlocks below, and the elevator in the garage below the cabin. Full-scale tests have included suited movement through the airlock, hatch, deck and elevator, but NASA published no clearance measurements. [NASA HLS engineer interview](https://www.nasa.gov/podcasts/houston-we-have-a-podcast/artemis-iii-paving-the-way-to-lunar-landings/), [NASA airlock test](https://www.nasa.gov/directorates/esdmd/artemis-campaign-development-division/human-landing-system-program/nasa-astronauts-practice-next-giant-leap-for-artemis/).

Official concept art shows a circular upper deck, perimeter windows, four visible seat positions with screens, railings, a central opening/vertical circulation path, storage panels and a very tall open upper void. This supports an **appearance study**, not a claim about flown seat count, exact deck arrangement, ladder/stair design, or ceiling height. The full-scale airlock test photograph is physical evidence of a rounded rectangular hatch, interior handholds/straps, wall panels and suited clearances; the test mockup is not necessarily flight hardware. [SpaceX Moon page](https://www.spacex.com/humanspaceflight/moon), [NASA 2024–25 airlock test paper](https://ntrs.nasa.gov/api/citations/20240012719/downloads/HLS%20Update%20Kent%20Chojnacki%20IEEE%20Aero%202025%20v2.pdf).

Additional views are now collected in the [interior evidence inventory](research/INTERIOR_LAYOUT.md): a republished SpaceX airlock view, an early airlock mockup photographed from above, an overhead control-deck concept, and 2026 NASA/SpaceX Cabin 1 footage showing a berth-like compartment. A NASA HLS capability slide lists sleeping, eating and hygiene functions without assigning rooms in Starship. NASA discussed exercise devices, but **no published HLS render confirms a separate gym**. No complete public rendering of the two airlocks together, all sleeping quarters, dining, hygiene and exercise areas was found. [NASA 2022 airlock slide](https://ntrs.nasa.gov/api/citations/20220012459/downloads/Brazilian%20Space%20Agency%20-%20Artemis%20Science%20slides%20-%20Weber.pdf), [NASA HLS capabilities slide](https://ntrs.nasa.gov/api/citations/20220015885/downloads/22%2010%2025%20ASCEND%20HLS%20Panel%20.pdf), [NASA 2022 committee minutes](https://www.nasa.gov/wp-content/uploads/2023/10/heoc-oct-31-nov-1-2022-rev2.pdf), [NASA 2026 Cabin 1 update](https://www.nasa.gov/missions/artemis/nasa-partners-accelerate-lander-development-for-2028-moon-missions/).

**Still unknown publicly:** actual clear inner diameter; pressure-shell/insulation thickness; cabin and airlock deck elevations; deck count and floor-to-floor heights; stair or ladder widths; hatch dimensions; window dimensions; exact bunk, galley, toilet, storage and ECLSS layout; elevator basket dimensions and travel path; landing-leg footprint; thruster/engine positioning. These are the high-impact choices an agent must label **estimated** in the 3D model. Do not convert the approximate airlock volume into claimed linear dimensions.

An [unofficial 2024 cutaway by TheSpaceEngineer / @mcrs987](https://unrollnow.com/status/1857393461248286897) is useful for visualizing one possible stack of crew, lower equipment deck and airlocks. It asserts **19.4 m³ per airlock**, which conflicts with SpaceX's later **approximately 13 m³** figure. Its room arrangement and dimensions are therefore **speculation**, never primary measurement data. Older concepts with long side solar arrays or different window bands may also be superseded.

## Local visual references

See [research/IMAGE_SOURCES.md](research/IMAGE_SOURCES.md) for the exact origin, credit and meaning of each file. The most useful starting views are:

| View | Local file | Use |
| --- | --- | --- |
| Official upper cabin, high resolution | [SpaceX cabin render](research/screenshots/spacex-hls-cabin-concept.jpg) | Perimeter, seating, windows, railing and central opening |
| Official tall main-cabin view, republished by Human Mars | [Main-cabin render](research/screenshots/spacex-hls-cockpit-view-3-republished.jpg) | Open vertical volume, upper hatch and circulation |
| SpaceX airlock view, republished by Human Mars | [Airlock view](research/screenshots/spacex-hls-airlock-view-republished.jpg) | Hatch, padded wall and control panel; not a two-airlock plan |
| NASA/SpaceX Cabin 1 frame from 2026 | [Berth-like compartment](research/screenshots/nasa-spacex-cabin-1-2026-main.webp) | Partial build view; exact room function unconfirmed |
| NASA exterior render | [HLS on the Moon](research/screenshots/nasa-2024-hls-exterior.jpg) | Overall silhouette and astronaut scale |
| NASA Engineering 2024 specification slide | [50 m / 9 m slide](research/screenshots/nasa-engineering-2024-hls-specifications.png) | Earlier published scale reference |
| Real full-scale airlock test | [NASA paper page](research/screenshots/nasa-2025-airlock-test.png) | Hatch and suit-scale physical reference |
| Early airlock mockup from above | [NASA 2022 slide](research/screenshots/nasa-2022-hls-airlock-overhead.png) | Airlock volume and early elevator test hardware; no flight dimensions |
| NASA 2026 HLS progress slide | [Cabin illustration](research/screenshots/nasa-2026-hls-cabin-progress-slide.png) | NASA explicitly labels the multi-level control-deck view as an artist's illustration |
| Unofficial deck-by-deck concept | [Design Freedom section](research/screenshots/unofficial-hls-interior-deck-plan-design-freedom.jpg) | Hypothetical crew pods and fitness equipment only |
| Unofficial sectional concept | [Fan cutaway](research/screenshots/unofficial-hls-cabin-cutaway.jpg) | Possible spatial organization only |

The screenshots/reference copies are stored for local research and retain their credited creators' rights. They are **not** texture assets licensed for redistribution in a finished viewer. NASA-hosted pages sometimes credit SpaceX for the underlying artwork.

## Recommended first implementation

1. Create a minimal local Vite + Three.js app. Set **1 scene unit = 1 m**, **Y up**, the ground at `y = 0`, and the hull centreline at `x = z = 0`. Keep the model's measurements in one small data file with `source`, `value`, and `status` (`published` or `estimated`); do not add a larger geometry framework.
2. Block out the exterior at **52 m high, 9 m diameter**. Make the 50 m older concept selectable only if a comparison is useful. Add a 1.8 m human silhouette, ground plane, basic legs, nose, window band, docking interface, elevator guide and a cutaway toggle. Keep all unpublished component sizes explicitly provisional.
3. Build the connected four-deck interior defined in [THREEJS_MODEL_SPEC.md](research/THREEJS_MODEL_SPEC.md): central walkable stair, upper control deck, four berth pods, galley, hygiene/science/exercise areas, two independently represented approximately **13 m³** airlocks, garage and elevator access. These room positions are estimated. Use the 600+ m³ claim as a **volume sanity check**, not as a license to present invented room dimensions as official. Make exterior walls hide or clip cleanly for inside views.
4. Add orbit/zoom exterior camera and interior camera presets. Provide a cross-section or transparent-shell view so users can understand the vertical relationship without opening a second model. Add measurement overlays for the published 52 m, 9 m and approximately 35 m elevator boarding level.
5. Review the model side by side with the local references at matching camera angles. Log every estimated deck elevation, hatch size, window placement and leg span in the data file. Replace assumptions only when a new source supports them.

### First-version acceptance criteria

- Exterior and interior can both be inspected in one local browser session.
- The 52 m / 9 m overall scale and 1.8 m human reference are correct in scene units.
- Four connected decks, a continuous stair, two distinct airlocks, garage and elevator route are visible in an interior/cutaway view. Every named room has a traversable opening sized for the later 1.8 m avatar.
- Published dimensions and artistic estimates are visibly distinguishable in the UI or model data.
- No fan concept is silently presented as a confirmed HLS blueprint.

## First-person mode (phase two)

The top bar shows **Walk in first person** on desktop and touch devices. It hides the interface except an exit button and spawns a 1.8 m-eye walker on the surface beside the lift ([`src/firstPerson.js`](src/firstPerson.js)).

- Click to capture the mouse/trackpad, **W A S D** to move, **Shift** to run, **E** or click to press a lift button, **Esc** to release the mouse.
- On phones and tablets it uses a mobile-game layout in landscape: a thumbstick appears wherever the left thumb lands on the left half of the screen, dragging on the right half looks around, **USE** (highlighted when you look at a lift button) presses it and **RUN** toggles running. On Android it requests fullscreen and locks landscape; elsewhere a prompt asks to rotate the phone. Ambient occlusion is off and shadows are lighter on touch devices to keep the frame rate up.
- The lift car is open on its hull side. Use the call panel at the ground station, the panel inside the car, or the panel at the garage gate. The car stops flush with Deck A.
- Collision uses a three.js `Octree` with a 0.3 m capsule. Boxes are simplified to cuboids; open surfaces (hull, nose, stair ramps, guard rails) are two-sided; the terrain uses its analytic height function. Lunar gravity is 1.62 m/s².
- Interior fit-out ([`src/interior.js`](src/interior.js)) follows the local references: hex-quilted airlocks with soft black hatches in padded white rims, bolted outer rims, grab bars, light coves, display panels and ladder racks; a framed, perforated lift cage; Cabin 1-style berths with wood ceilings and glowing end frames; a control deck with tripod seats, a display bar, curved wood benches, an icon light strip and polished flat-bar rails. Walls run floor to ceiling.
- Walking route: lift → garage gate → either airlock (outer and inner hatches) → Deck A hall → straight stair A→B (left lane, toward −Z) → B→C (right lane, toward +Z) → C→D (left lane, toward −Z) → Decks B, C and D.

## Later objective: walkable level (not part of the first version)

A later phase should use a **1.8 m tall human character** to explore the accessible interior and, eventually, the elevator and lunar surface. Plan for familiar shooter controls: **W/A/S/D** movement, mouse look with pointer lock, **Shift** sprint, **Ctrl** crouch, and optional jump/interact keys. Use collision, stairs/ladder or elevator interaction, doorway clearances and camera height appropriate to a 1.8 m avatar. Movement speed, suit size and gravity behavior will be game-design choices, not inferred spacecraft dimensions. This phase is recorded here only; it is **not implemented now**.

## Third-party assets in the viewer

- `public/models/nasa-z2-spacesuit.glb`: NASA Z2 planetary spacesuit, from [NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Z2%20Spacesuit). Draco-compressed; the decoder in `public/draco/` is copied from the installed `three` package.
- `public/textures/earth-blue-marble-2048.jpg`: Earth texture from the [three.js examples](https://github.com/mrdoob/three.js/tree/r181/examples/textures/planets), derived from NASA Blue Marble imagery.
- The lunar terrain (`src/terrain.js`) is fully procedural: power-law crater population with rims and ejecta, bright halos around fresh craters, boulder fields on fresh rims, a regolith detail/normal map and distant highlands. NASA orbital photographs were not used because their baked shadows and perspective do not work as a ground texture.
