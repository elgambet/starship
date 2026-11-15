# Starship HLS: self-contained Three.js model specification

**Research and design snapshot:** 15 November 2026. **Purpose:** an implementation agent should be able to build the exterior and a complete, connected, inspectable interior from this document alone. The model is a plausible **crewed lunar Starship HLS**, not a claim to reproduce unreleased SpaceX CAD. It must support a later 1.8 m first-person character without rebuilding the floor plan. Propulsion, flight dynamics and pressure simulation are outside scope.

## 1. Evidence rules and model contract

Use these labels in the code data and in any measurement UI:

- **Published:** a stated approximate value or feature from NASA or SpaceX. It may still change.
- **Observed:** visible in a photograph or render, but not dimensioned or guaranteed for flight.
- **Estimated:** a deliberately chosen value that makes this particular walkable model coherent. Never present it as a SpaceX measurement.
- **Unofficial:** independent fan design. Use only as inspiration for missing room functions.

The implementation must have **four traversable decks**, a continuous stair route between adjacent decks, two separate airlocks with inner and outer hatches, a route from both airlocks into a shared garage/elevator boarding area, crew berths, galley, hygiene, science/storage and a compact exercise area. Every named room must be reachable by a 1.8 m avatar through a real opening; no painted doors, inaccessible decorative floors or teleport-only connections. The first version remains a visual Three.js model with cameras and cutaway controls. Walking controls and collision are the **next phase**, but this geometry must be ready for them.

The exterior should read immediately as the white, slender lunar Starship rather than the standard orbital Starship. A full-height view should include a 1.8 m human reference, landing legs, dark window areas, side elevator and lunar ground. An interior view must show the whole vertical route and allow inspecting every deck.

### Published constraints to retain

| Item | Published information | Modeling consequence |
| --- | --- | --- |
| Overall ship height | NASA published **50 m** for a 2024 concept; 2026 NASA material says about **171 ft / 52.1 m**. | Use **52 m** as the nominal model height. 50 m is an older concept, not a second current dimension. |
| Outside hull diameter | **9 m** nominal. | Cylindrical outside radius **4.5 m**. Landing legs and elevator extend beyond it. |
| Pressurized habitable volume | SpaceX says **more than 600 m³ combined**; a NASA engineer describes about **22,000 ft³ / 623 m³**. | Treat this as a coarse envelope check. It does not specify deck count, inner diameter or room dimensions. |
| Airlocks | **Two**, about **13 m³ each** according to SpaceX. | Show two distinct pressure volumes and two independent inner/outer hatch pairs. Their chosen linear dimensions below are estimated. |
| Elevator | NASA OIG places the boarding area about **115 ft / 35.1 m above lunar ground**. | Put the upper lift platform at **y = 35.1 m**; it leads from the garage to the surface. |
| Vertical order | NASA describes a crew cabin high in the ship, airlocks below it, and an elevator in the adjacent/below garage area. | Keep the habitable decks above the garage, with airlocks at the low end of the cabin. |
| Habitability functions | A NASA Starship HLS capability slide names sleeping, eating, hygiene, dust/airlock, elevator, science/geology. NASA meeting minutes discuss exercise devices. | Include these functions, while marking their room layout and exercise equipment **estimated**. There is no confirmed dedicated gym. |

**Do not infer** deck heights from the older 2024 diagram's **22 m upper-region** annotation; that region includes more than habitable space. Its older 1,200 t propellant / 100+ t payload values do not specify visible cabin geometry. Do not copy heat-shield tiles, flaps or a full Super Heavy booster from orbital Starship artwork into this HLS scene.

## 2. Coordinate frame and fixed build dimensions

Use **1 Three.js unit = 1 m**. `+Y` is up, lunar ground is `y = 0`, hull centreline is `(x,z) = (0,0)`. In this *model only*, `+Z` is the forward/window-facing side, `-Z` is the garage/elevator side, `+X` is right when facing `+Z`. Azimuth `0°` points to `+Z`, `90°` to `+X`, `180°` to `-Z`, `270°` to `-X`. Actual flight-vehicle azimuths are unpublished.

| Feature | Build value | Status / reason |
| --- | --- | --- |
| Total height | 52.0 m, ground to nose tip | Published approximate baseline. |
| Hull outside diameter | 9.0 m | Published nominal. |
| Hollow interior radius | 4.2 m | Estimated: leaves a 0.3 m visual shell/insulation band; **not** a pressure-shell thickness claim. |
| Lower skirt/body bottom | y = 2.4 m | Estimated to expose landing pads and underside. |
| Straight cylindrical body | y = 2.4–47.4 m | Estimated silhouette. This keeps walkable headroom at the outer edge of Deck D. |
| Tapered nose | y = 47.4–52.0 m; radius falls from 4.5 to about 0.45 m | Estimated profile matched to illustrations. Keep a rounded/blunted tip. |
| Elevator upper landing | y = 35.1 m | Published approximate boarding height. |
| Deck A floor | y = 35.1 m | Estimated, aligned with boarding area. |
| Deck B floor | y = 38.3 m | Estimated. |
| Deck C floor | y = 41.5 m | Estimated. |
| Deck D floor | y = 44.7 m | Estimated. |
| Floor-to-floor spacing | 3.2 m on A→B, B→C, C→D | Estimated; leaves roughly 2.6–2.8 m clear after structure and services. |
| Floor structural thickness | 0.18 m | Estimated. Do not bridge the stair opening. |
| Central spiral stair opening | 3.0 m diameter; centre at x = 0, z = +0.30 m; stair outer radius 1.40 m, inner guard radius 0.45 m | Estimated; practical walk line around radius 1.0–1.1 m. The slight forward offset clears the Deck A garage bulkhead. |
| Ordinary passage | ≥ 1.0 m clear width, ≥ 2.1 m clear headroom | Estimated first-person design minimum. |
| Berth and hygiene doors | ≥ 0.9 m clear width, ≥ 2.1 m clear height | Estimated. |
| Airlock hatches | ≥ 1.2 m clear width, ≥ 2.1 m clear height | Estimated for a suited figure, **not** a published hatch dimension. |

The selected 4.2 m inner radius and an upper pressurized envelope of roughly y = 35.1–51 m give a gross cylinder-plus-nose volume comfortably above 600 m³ before structure, equipment, deck material and the unpressurized garage are subtracted. This is only a plausibility check. The exact certified pressure boundary and net volume cannot be reconstructed from the sources.

## 3. Exterior shape and recognizable details

1. Make the main hull a smooth, near-white vertical cylinder. Use 96 or more radial segments at close viewing distance. Add restrained vertical panel joints and a few horizontal joints; avoid a heavy corrugated or tiled look. The real finish may be insulation or coating, so use the color as an appearance choice.
2. Shape the nose as a smooth ogive-like taper, not a sharp cone. A simple radial profile for `LatheGeometry` is `(radius, y)` = `(4.5,47.4)`, `(4.25,48.0)`, `(3.55,49.0)`, `(2.55,50.1)`, `(1.25,51.3)`, `(0.45,52.0)`. Smooth between points. These profile numbers are **estimated**.
3. Add a small circular docking hatch centred at the top with an understated rim. Diameter about 1.1 m is **estimated**; it is not a released NASA docking-system dimension. It may be a non-walkable service hatch in phase one, accessed from Deck D by handholds/short ladder rather than a fifth full floor.
4. Use a dark, black-blue upper collar with individual rounded-rectangle windows, not one featureless black cylinder. The implemented concept places this collar around **y = 38.3–47.4 m**, a broad lower glazing group around **y = 39.0–43.2 m** and the small crew-control windows around **y = 45.2–46.5 m** on the `+Z` half. These locations and counts are **estimated** from varying art; the broad lower glazing is an interpretive choice to reveal the inhabited levels. Interior views must align windows with rooms, not show windows through solid floors.
5. Cabin 1 build footage shows tall, rounded-rectangle exterior openings and white panel seams with many fastener marks. Use a dark gasket border around each window, a shallow recessed reveal, and sparse short fastener seams. The number and width of real openings remain unknown.
6. Add a narrow vertical elevator guide on the `-Z` side from the boarding point at y = 35.1 m down to near the ground. A caged rectangular platform at the top should fit two suited figures side by side in the **visual concept**; choose approximately 2.6 × 2.2 m as an **estimated** platform footprint. Put the boarding gate on the garage side. A rail along the guide and a visible cable/track give scale; do not require moving machinery in phase one.
7. Show **four** splayed landing legs as a visual estimate. Each has a dark strut from lower hull around y = 5–7 m to a wide shallow footpad near y = 0. Their spread, count, pivots and load structure are not published dimensions. Keep all pads outside the 9 m hull and above the terrain.
   For the default scene, aim the footpad centres toward the diagonal azimuths 45°, 135°, 225° and 315° at roughly 7.0 m from the centreline. These coordinates are only a visual spacing choice.
8. The lower shell should have a few dark recessed bays and a simple underside/skirt. Engine geometry can be stylized or hidden; propulsion is not needed for interior usability. Do not use large orbital flaps or a full heat-tile side.
9. A small NASA marking and U.S. flag appear on older exterior art. If included, recreate as simple vector/canvas decals placed above the lower dark band. Keep them optional because image rights and changing configuration can affect final distribution.

The exterior must remain inspectable as an opaque ship. Provide a **front-half cutaway** and a **transparent-shell mode** to reveal the interior. Hide or split selected hull sectors; do not rely on looking through solid white geometry. Use actual openings for windows or hide their backing shell in the interior view. Do not put an opaque exterior hull behind transparent glass and then claim the cabin is visible.

## 4. Walkable interior architecture

### 4.1 Common circulation and deck construction

The four floors are full or partial annular decks around one continuous central spiral staircase. Build every floor as actual geometry with a circular stair opening, structural rim and guardrail. The opening is about 3.0 m across. The stair is visible in the SpaceX crew-cabin art as a curved central access feature; the exact real solution is unpublished. Use **18 risers per 3.2 m level** (`0.178 m` per riser) and **20° around the centre per tread**. At a 1.05 m walking radius, the arc between treads is about 0.37 m. Tread walking width from inner guard to outer guard is about 0.95 m. Add inner and outer railings at roughly 1.0 m above treads, and flat landing portions flush with each deck. Put no gap or collider lip at each transition.

For future first-person movement, retain visible individual treads but allow a smooth, hidden ramp collision surface along the stair route. The character must be able to walk from A to D without jumping, flying or teleporting. The player capsule should later fit a **1.8 m tall** standing avatar with a radius around **0.3 m**. Keep a continuous ≥ 0.9 m passage around furniture and ≥ 1.0 m through main circulation. A stair guard is required at every open edge; never leave a fall-through slit between deck and stair.

The peripheral annular area from stair radius 1.4 m to inner hull radius 4.2 m is only 2.8 m deep. Place perimeter furniture and cabins at radial depth about 0.9–1.2 m, leaving an inner circulation ring roughly 1.2–1.6 m clear. Where a closed room needs more depth, use a limited angular sector and show an actual door into it. Use the same consistent deck labels in UI and code.

### 4.2 Deck A: two airlocks, garage and elevator (floor y = 35.1 m)

This is the EVA/ingress floor. Put a pressurized central access area on the `+Z` side of the stair. Place **Airlock A** near x = +2.55 m, z = 0 and **Airlock B** near x = -2.55 m, z = 0. They must be separate enclosed rooms, not two doors into one room. Use a clear internal rectangular volume of **2.0 m (X) × 2.83 m (Z) × 2.30 m (Y) = 13.02 m³** for each, then round the corners or shape the walls without changing volume much. All three linear dimensions are **estimated**; only the approximately 13 m³ volume is published. The outside corners of these room boxes remain within the proposed 4.2 m inner radius.

Give each airlock a front/inner hatch toward the pressurized `+Z` access arc and a rear/outer hatch toward the unpressurized `-Z` garage arc. The inner and outer hatch of each room are separately visible. The rear arc of Deck A is an **unpressurized garage zone** with a real walking path linking both outer airlock hatches to the elevator gate at `-Z`; leave at least 1.1 m clear along this route. An estimated pressure bulkhead runs across Deck A near `z = -1.45 m`, with the airlocks piercing it. The stair is entirely on the pressurized side; its forward offset prevents its railing from intersecting the bulkhead. The airlock walls and hatches, rather than a magical invisible boundary, form the pressure transition. For phase-one viewing, hatches may be visibly open; later interaction can animate them without changing the openings.

The garage deck meets the elevator upper platform at **y = 35.1 m** with no step. The lift projects outward from the `-Z` hull. At y = 0, show a matching landing pad/open gate so a later level can connect the ship to lunar terrain. The lift is a traversal route, not a second airlock. If the exact curved garage outline is hard to construct, prioritize a clear, collision-friendly connecting corridor within the 9 m footprint and show the garage as an inset side bay; do not erase the second airlock.

**Deck A placement check:** with the two airlock centres at x = ±2.55 m and z = 0, each 2.0 × 2.83 m room spans x = 1.55–3.55 m (or mirrored) and z = -1.415–+1.415 m. Put each inner hatch in its `+Z` end wall and each outer hatch in its `-Z` end wall. The stair centre at z = +0.30 m stays forward of the garage bulkhead at z ≈ -1.45 m. The front access arc at z > +1.415 m leads from the stair to both inner hatches. The rear garage arc at z < -1.415 m leads from both outer hatches toward the lift gate at z ≈ -4.5 m. A lift platform centred around z = -5.45 m with a 2.2 m radial depth meets that gate. Door and wall thickness are extra geometry outside the stated clear airlock volume; adjust the panels slightly rather than narrowing the specified clear route.

Visual detail: the 2022 overhead airlock mockup is a light gray cylindrical bay with segmented curved wall/ceiling panels, hoses and an unpolished test floor. A later full-scale mockup photograph shows a large rounded-rectangle hatch with a thick dark bolted rim, white wall panels, hexagonal padded sections, a dark floor, hanging straps, emergency equipment and a black ladder-like rack. A republished SpaceX airlock view shows a dark flexible rectangular hatch, white hexagonal padding, a vertical black handhold, continuous ceiling light and a flush white control wall with a small screen. Combine these motifs without implying the images document the same final unit. Two 1.8 m human scale dummies should fit in an airlock during validation.

### 4.3 Deck B: utility, hygiene, science and exercise (floor y = 38.3 m)

The central stair opens onto a continuous annular circulation zone. Allocate the perimeter to **one enclosed hygiene compartment** (toilet/wash unit, 0.9 m clear door), **one science/geology bench** with sample drawers and restraint points, **life-support/storage cabinets**, and **one compact exercise station**. These are required *functional modeled spaces* for this project, but all locations, dimensions and equipment designs are **estimated**. Place the exercise unit against a wall so the central route remains ≥ 1.0 m wide. A simple resistance device with two hand grips, a fold-down footplate and a restraint belt communicates exercise without asserting that NASA approved a dedicated gym. Place the hygiene room behind a visual privacy panel; it must have a real traversable doorway.

Suggested sectors, viewed from above: science/workbench at 0–75°, hygiene at 75–135°, exercise at 135–225°, life-support/storage at 225–360°. Shift them as necessary for stair landings and clearances. A later avatar must be able to enter hygiene and stand at science/exercise stations; drawers and panels may be decorative.

For an initial placement, put all large cabinets at radii **3.0–4.2 m**, with the door faces toward the central ring. Give the hygiene room roughly a **1.5 × 1.8 m** internal standing footprint, the science bench about **2.0 × 0.65 m**, and the folded exercise unit about **1.2 × 0.8 m**. These are *estimated* furniture clearances, not spacecraft specifications. Leave at least 1.2 m clear around the stair landing.

### 4.4 Deck C: habitation and food (floor y = 41.5 m)

Create **four compact berth pods** around the outer wall, each with a recessed sleeping surface/restraint bag, a small reading light, one personal-storage locker and a sliding/hinged access panel that leaves ≥ 0.9 m clear when open. Four is a **design assumption** motivated by the four seated figures visible in concept art, not a published HLS bunk count. The 2026 Cabin 1 footage shows a narrow white padded compartment with a flat horizontal strapped surface, rounded rectangular end panel, concealed light strips and a warm tan ceiling panel. Reuse those visual cues for each pod, but label the identification of that footage as a sleeping berth **inferred**.

Put a compact galley/eating alcove on this deck with a fold-down table, two or four restraint-friendly seats, food/stowage lockers and a clear route around it. Include one small shared work surface. Do not model a large restaurant-style dining hall. A galley is a functional assumption derived from NASA's sleeping/eating/hygiene requirement; its exact placement is unpublished. Keep the four pod entrances connected to the main ring. If space is tight, use radial berths that open toward the ring and place the galley on a partial mezzanine, but keep every opening walkable.

Default polar plan: place berth centres at **50°, 130°, 230° and 310°**, each using about **35°** of perimeter arc at radius 3.6 m and a radial depth around 1.2 m. This gives roughly 2.2 m of tangential berth frontage per pod. Put the galley near **180°** in the free gap between the second and third pods, and a small shared work surface near **0°** between the fourth and first pods. Berth fronts face inward; doors must open into the 1.2–1.6 m clear circulation ring without blocking it. A pod is about **2.1 m long × 1.2 m deep × 2.2 m high** as an *estimated* layout module.

### 4.5 Deck D: window-facing crew/control deck (floor y = 44.7 m)

This deck follows the official artist images most closely. Put the main window arc on `+Z`, with **four high-backed white-and-charcoal seats** on narrow dark frames facing individual low-profile black screens. The visible render has four seats, but this is a **visual count**, not flight certification. Each seat has white exterior shells, dark gray interior padding, armrests and a tall head surround. The screens are thin black rectangles with blue/cyan UI hints, not a wall of glowing monitors.

Build a dark charcoal floor with broad curved panels. Along the opposite/left perimeter, install curved white wall panels, a slim continuous light band close to the ceiling, a few flush square service hatches, black ventilation slots and wood-tone or warm gray folding work surfaces. Around the central stair, use two or three levels of curved guardrail/ring as seen from the high and low camera angles; keep them within the available headroom. The render's tall view looks upward through a clean white conical void toward a circular docking opening; add a visual upper void above Deck D and a central access hatch at the nose. A short secured ladder/handhold route to that hatch may be shown, but do not treat the nose as a full fifth walkable floor.

For the starting layout, centre the four seat stations near **-36°, -12°, +12° and +36°** around the `+Z` window arc at radius about **3.3 m**. Put the work/storage bank broadly on the opposite side near 180°. Keep at least **1.2 m** between the central stair landing and the back of any seat; a standing avatar should be able to reach every station without crossing a railing.

The render camera from above shows a ring-like layout: windows and four seats on one side, a dark central opening, a curved worktable/storage bank across from seats, and a white circular wall. The view from below shows the same volume's tall curved wall, overhead circular opening, rails, a small access ladder and numbered storage doors. These are **different viewpoints of the control/cabin volume**, not proof of extra decks. Keep the deck recognizable in both views.

## 5. Room openings and traversal graph

Build the following as connected walkable spaces. `↔` means a real doorway or stair contact, not a camera-only link.

```text
Lunar surface ↔ elevator platform ↔ Deck A garage
Deck A garage ↔ Airlock A outer hatch ↔ Airlock A ↔ inner hatch ↔ Deck A pressurized hall
Deck A garage ↔ Airlock B outer hatch ↔ Airlock B ↔ inner hatch ↔ Deck A pressurized hall
Deck A hall ↔ central spiral stair ↔ Deck B ring ↔ central spiral stair ↔ Deck C ring ↔ central spiral stair ↔ Deck D ring
Deck B ring ↔ hygiene room / science bench / exercise station / storage
Deck C ring ↔ berth pods 1–4 / galley
Deck D ring ↔ control seats / work surfaces / docking access ladder
```

Use collision-ready mesh groups or simple aligned colliders for every floor, stair, wall, railing and door frame. Do not fill a room's entrance with a solid wall behind a decorative door. When a hatch is closed, it may block passage; when opened, a complete aperture must exist. Put door swings/sliding paths where they do not reduce a corridor below its minimum clearance. Interior inspection camera presets should land inside real spaces, and a top-down debug view should show the graph.

## 6. Materials, texture mapping and asset generation

**No production texture files have been generated yet.** The 17 local screenshots are research images and are **not** texture maps or redistributable art assets. The first implementation can generate all needed maps locally at runtime with Canvas 2D plus `THREE.CanvasTexture`, using a fixed random seed so every run looks the same. A build agent may later save generated PNGs under `public/textures/` for load speed; if it does, record the filenames and UV coverage in the implementation README. Do not place the source screenshots on the meshes as decals or photo textures.

| Surface | Geometry/material baseline | Texture mapping recipe |
| --- | --- | --- |
| White exterior hull and nose | `MeshStandardMaterial`, base `#e9ecec`, roughness about 0.55, metalness 0.05. | **No bitmap required.** Use subtle geometry seams and very low-contrast vertex/canvas variation only. Avoid pristine pure white and avoid dramatic dirt streaks. |
| Dark window surround | Near-black blue `#101820`, roughness 0.35. Window gasket `#171b20`. | Curved panel geometry. Individual windows are clear/dark glass with actual openings. Optional tiny seam/fastener decals generated from Canvas. |
| Window glass | `MeshPhysicalMaterial`, blue-gray tint `#8ca6b0`, roughness about 0.08, metalness 0, transmission about 0.75, thickness roughly 0.02 m. | No color bitmap. Keep glass visible but let cutaway reveal room geometry. Confirm current Three.js transmission behavior against its docs during implementation. |
| White cabin panels | `#e8eaeb` to `#f2f2f0`, roughness 0.65, shallow panel joints. | Use panel geometry or a 1024² Canvas tile covering about 4 × 4 m with 0.5–0.7 m rectangular seams. Use same UV scale across cylindrical patches; never stretch one tile over the full 52 m hull. |
| Padded hex airlock wall | Warm white `#e7e7e4`, roughness 0.8. | Generate a 1024² Canvas color map for a 4 × 4 m patch: staggered rounded hexagons about 0.55 m across, 4–8 px gray seam, slightly brighter cell centres, faint shadow near edges. A matching grayscale bump map may use height contrast ≤ 0.01 m. Repeat only across designated padded wall panels, not over doors or windows. |
| Dark floor | Charcoal `#272a2d`, roughness 0.8. | Canvas 1024² tile covering 2 × 2 m with very low-contrast noise, fine straight panel joins and occasional inset fastening circles. Use planar XZ UVs. Do not make a large checkerboard. |
| Light fixtures | Slim off-white strips with emissive `#dce8ed`; warm berth light `#f0d6aa`. | Geometry strips along curved wall/ceiling joins; optional emissive map unnecessary. Add local lights sparingly to illuminate, not flood, the cabin. |
| Metal railings, hatch rims and elevator frame | Satin gray `#777f84` or dark graphite `#30373b`, metalness 0.65–0.85, roughness 0.3–0.5. | Geometry gives most detail. Add thin bolts on hatch rims as instanced circles/short cylinders at even intervals. No photographic metal texture needed. |
| Black airlock hatch/soft seal | `#17191d`, roughness 0.85, shallow padded folds. | Create as a dark recessed surface plus curved seam and a few hanging straps. If a texture is useful, 512² Canvas map with subtle radial folds, not the photograph itself. |
| Elevator mesh/grating | Dark gray metal. | Prefer actual spaced bars if viewed close. For distant mesh, use a transparent Canvas grid: 1024², bars 6–8 px wide at about 80 px intervals, alpha background 0. If alpha map sorting is troublesome, geometry bars are simpler. |
| Lunar ground | Neutral gray `#777b7c`, roughness 1.0. | Generate a 1024² seeded 4-octave noise tile with 8–16 m world coverage. Use planar XZ UVs, repeat it across a 150–200 m ground plane, add separate low polygon craters/rocks to break repetition. The terrain texture is original procedural art, not copied from NASA imagery. |
| Seat padding / berths | Seat charcoal `#454b50`; berth fabric `#c5c1b7`; light gray straps. | Fine Canvas noise at 512² with a 1 × 1 m repeat; use geometry for seams and straps. No complex fabric normal map is required. |
| Screens, labels, NASA/flag decals | Screens near-black with tiny muted cyan/blue graphs; labels white/gray. | Draw with Canvas at 512² or SVG authored in code. Text must be legible but generic; avoid using reference screenshots as screen content. NASA/flag decals are optional and should be separate meshes. |

For Canvas color textures, set the color space to sRGB and enable appropriate filtering. Treat grayscale bump/normal/alpha maps as non-color data. Set `wrapS`/`wrapT` to repeat where the UV recipe calls for tiling. A 1024² color tile should cover a declared physical area, not merely a mesh's 0–1 UV span. The Three.js [CanvasTexture guide](https://threejs.org/manual/pages/canvas-textures.html), [LatheGeometry documentation](https://threejs.org/docs/pages/LatheGeometry.html) and [color management guide](https://threejs.org/manual/pages/color-management.html) are the API references; use the installed package's current API when coding.

**Procedural generation details:** use one fixed integer seed, for example `20261115`, and a tiny deterministic PRNG (such as Mulberry32) for every noise tile so screenshots are repeatable. For regolith and fabric, layer value noise at spatial frequencies 1, 2, 4 and 8 with amplitudes 1, 0.5, 0.25 and 0.125, normalize, then restrict color variation to roughly ±6–10 RGB levels around the base color. For regolith, wrap sample coordinates at the tile edges so repetition has no hard seam; craters and larger rocks should be separate meshes. For the hex padding, draw staggered rounded hexagon outlines in Canvas with a 0.55 m world cell width, fill centres 2–4 RGB levels lighter than edges and draw seams 4–8 px wide at 1024² resolution. Build the corresponding bump canvas from the same geometry using gray levels near 128 for seams and 140–145 for cell centres, with very small bump scale. For floor panels, draw sparse 1–2 px seams over low-amplitude noise. Do not add random marks that resemble printed text or spacecraft labels.

**UV convention:** on cylindrical wall patches, `u = azimuth / 2π` and `v = worldY / tileHeight`; on horizontal floors and terrain, use world-space planar `u = x / tileWidth`, `v = z / tileDepth`. Use separate UVs for each window reveal, berth cushion and elevator panel. This prevents a 4 m texture patch from stretching around the full 9 m diameter or all 52 m of hull. Geometry seams should coincide with the UV panel edges where practical. If the builder saves texture PNGs instead of generating them on startup, use descriptive names such as `airlock-hex-color.png`, `airlock-hex-bump.png`, `cabin-floor.png` and `lunar-regolith.png` under `public/textures/`; the current project contains **none** of these files.

## 7. Build sequence for the implementation agent

1. Create a minimal local Three.js app with one scene and one small dimensions/configuration file. Every number in this document should be accompanied there by `status: 'published' | 'observed' | 'estimated'` and a short reason. Do not create a generic spacecraft framework.
2. Build the 52 m exterior silhouette, terrain, legs, elevator route and 1.8 m scale human. Check total height and 9 m diameter in scene units.
3. Build the inner shell, decks A–D, circular floor cutouts and one continuous spiral stair. Inspect from a top-down camera that each deck landing is flush and every guardrail covers an exposed edge.
4. Add the two separate approximately 13 m³ airlocks, four hatches, garage and elevator platform. Test the route graph visually and with a 0.3 m radius / 1.8 m height debug capsule. The debug capsule can be moved in an editor/test routine; full WASD controls are phase two.
5. Furnish Deck B, Deck C and Deck D. Prioritize room entrances and human clearance over detail. Keep the official control-deck visual cues strongest; mark invented habitation and exercise rooms as conceptual.
6. Add generated materials/textures, light strips, windows and the exterior cutaway toggle. Place camera presets for full exterior, each deck, airlock, garage/elevator and a vertical section.
7. Verify that the model is plausible from both outside and inside. From the front half-cutaway, the four floors, staircase, two airlocks and lift access must be recognizable. From interior camera presets, no room should reveal an opaque hull wall where a window or door is meant to be.

### Acceptance criteria for this specification

- One `m` in code equals one metre. Published numbers are 52 m nominal height, 9 m nominal hull diameter, 35.1 m approximate lift boarding height, two roughly 13 m³ airlocks, and a coarse 600+ m³ combined pressurized-volume claim.
- Four actual connected decks exist. A 1.8 m avatar route can later reach **every** deck and named functional room via stairs and doors. No ceiling/floor jump, teleport or impossible intersection is required.
- Both airlocks have real inner and outer hatches; both connect the pressurized hall to the garage/elevator route. The elevator is reachable at its upper station and can later descend to the surface.
- Berths, galley, hygiene, science/storage and compact exercise are present as documented estimates, with clear walking areas.
- Screenshots from the project are used only as research references. Any texture mapped onto the model is code-generated or a separately licensed asset recorded by path.
- The UI or model data distinguishes published facts, observed visual motifs and estimated layouts. Fan concepts never silently become official measurements.
- A later 1.8 m first-person controller can use W/A/S/D, mouse look, Shift for faster movement and Ctrl for crouch. The route, stairs and doorways in this phase must work before those controls are added.

## 8. Image-by-image visual transcription

The following account covers **all 17 local screenshots**. It is included so a builder need not open them to understand what to model. The paths are retained only for provenance and visual QA. A slide may include unrelated examples; the description states what to use and what to ignore.

| Local image | What is visibly present | What to build / avoid |
| --- | --- | --- |
| [`spacex-hls-cabin-concept.jpg`](screenshots/spacex-hls-cabin-concept.jpg) | High-angle view into a large circular white cabin. Four sculpted white seats with dark cushions stand at a curved row of rounded windows and thin dark screens. A charcoal curved floor surrounds a central circular opening with light guardrails; opposite the windows are curved wood-tone work surfaces, dark storage doors and white flush wall panels. A slim wall light strip and vents follow the hull. | Primary Deck D art direction: circular dark floor, window arc, four seats, central rail/stair void, work/storage arc. Dimensions and seat count are visual, not certified. |
| [`spacex-hls-cockpit-view-2-republished.jpg`](screenshots/spacex-hls-cockpit-view-2-republished.jpg) | Near-vertical overhead view of the same circular control environment. Window/seat sector occupies one side; curved workstation and white wall occupy the other. A central dark circular aperture, a partial inner ring and a short stair/railing segment are visible. | Confirms radial zoning and central circulation. Do not infer a deck diameter from pixels. |
| [`spacex-hls-cockpit-view-3-republished.jpg`](screenshots/spacex-hls-cockpit-view-3-republished.jpg) | Tall view upward through a clean white tapered interior. One suited figure stands below, another appears high on the wall. Curved rails/platform edges, dark numbered storage hatches, a ladder-like vertical element and a small circular upper hatch lead toward the nose. | Give Deck D a tall upper void, visible vertical circulation and nose docking hatch. This is not proof of a separate gym or another whole deck. |
| [`spacex-hls-airlock-view-republished.jpg`](screenshots/spacex-hls-airlock-view-republished.jpg) | Bright close view: a large black soft-looking rounded rectangular hatch fills one wall, bordered by white padding. The adjacent wall has large quilted white hexagons, a black vertical grab bar, high continuous light, a small built-in screen/control panel, vents and a black floor. | Use as an airlock/pressure-transition material reference. It is republished as SpaceX imagery but does not show both airlocks or their final installation. |
| [`nasa-spacex-cabin-1-2026-main.webp`](screenshots/nasa-spacex-cabin-1-2026-main.webp) | NASA-watermarked Cabin 1 build frame. A narrow, almost room-width horizontal beige/gray strapped surface extends toward a bright white end wall. The end wall has a large rounded rectangle; white padded sidewalls, concealed light strips and a warm tan ceiling panel make the space look berth-like. | Use as a **possible berth pod** aesthetic. Its actual function, length and location are not publicly labeled. |
| [`nasa-spacex-cabin-1-2026-windows.webp`](screenshots/nasa-spacex-cabin-1-2026-windows.webp) | Curved white Cabin 1 outer shell under construction. A row of tall rounded rectangular apertures/panel outlines, fastener rows and vertical temporary support rails is visible; one opening is dark and unobstructed. | Use rounded-window shape and panel-fastener rhythm. Omit temporary construction props and do not count every outlined panel as a finished window. |
| [`nasa-2024-hls-exterior.jpg`](screenshots/nasa-2024-hls-exterior.jpg) | Tall, nearly featureless white Starship on a gray lunar plain under black sky. Smooth tapered nose, a small upper row of window-like marks, a darker lower window band, NASA/flag marks, dark lower bays and long angled landing legs with broad feet. Earth appears small in the background. | Primary whole-ship silhouette, white/dark balance, legs and lunar scale. Earth/background are optional scene dressing. No leg span or exact window elevations can be read from art. |
| [`nasa-2024-hls-elevator.jpg`](screenshots/nasa-2024-hls-elevator.jpg) | Two suited astronauts stand on a broad external grated platform with waist-high rails and side panels, beside a large landing leg and white hull. A side gate/connection meets the ship; the platform has an open top/cage-like upper frame. | Model a grated, railed external lift that can fit two suited figures and connect to the garage. Its shown size is perspective-only. |
| [`nasa-engineering-2024-hls-specifications.png`](screenshots/nasa-engineering-2024-hls-specifications.png) | NASA Engineering slide explicitly states 50 m height, 9 m diameter, 1,200 t propellant capacity and 100+ t payload for a 2024 HLS concept. It uses an older art image with white hull, black upper cabin belt and low legs. | Use the 9 m hull baseline. Treat 50 m as an earlier published height; do not turn payload/propellant values into guessed tank shapes. |
| [`nasa-2024-hls-dimensions-slide.png`](screenshots/nasa-2024-hls-dimensions-slide.png) | Older adapted concept illustration labels 50 m total, 22 m upper region, payload, airlock/elevator and broad methane/oxygen tank zones. The pictured ship has a long dark cabin/garage section and lower white body. | Use only the broad order of cabin/airlock/elevator above propellant. The 22 m bracket is **not** a measured habitable-cabin height; tank proportions are old conceptual art. |
| [`nasa-oig-2026-height-elevator.png`](screenshots/nasa-oig-2026-height-elevator.png) | NASA OIG comparison shows Starship much taller than Apollo and Blue Moon. Text states the lift is just below crew compartment and approximately 115 ft above the ground. | Set lift upper station at about y = 35.1 m. Do not scale the ship by measuring this composite image's pixels. |
| [`nasa-2022-hls-habitability-slide.png`](screenshots/nasa-2022-hls-habitability-slide.png) | NASA slide titled Starship HLS Capabilities lists sleeping/eating/hygiene, dust control in an airlock, surface elevator and science/geology. The slide includes an Apollo-era sleeping sketch and hardware photos plus an HLS exterior render. | Model the listed functions. **Do not copy the Apollo sketch or hardware as Starship interior fixtures.** |
| [`nasa-2022-hls-airlock-overhead.png`](screenshots/nasa-2022-hls-airlock-overhead.png) | NASA progress slide shows four early elevator test photos, one crew-cabin VR evaluation and a small overhead photo of people in a light curved airlock/mockup chamber with vertical seams and hoses. | Shows airlock human-scale curvature and elevator development, not a deck plan. Test hardware and temporary structural frame are not flight finishes. |
| [`nasa-2025-airlock-test.png`](screenshots/nasa-2025-airlock-test.png) | NASA paper page with a full-scale HLS airlock test photograph: a thick dark bolted rounded-rectangular door frame, white hex-panelled curved interior, dark floor, overhead straps/cables, suit-wearing test subjects and a black rack. Other page text and booster photo are unrelated to cabin design. | Make each airlock credible for suited movement; include hatch rim, padding, rails/straps and floor. Do not model the unrelated booster photo. |
| [`nasa-2026-hls-cabin-progress-slide.png`](screenshots/nasa-2026-hls-cabin-progress-slide.png) | NASA March 2026 slide explicitly calls the small grayscale multi-level circular cabin image an **artist's illustration**. It also shows docking test hardware, a Starship flight view and a Blue Origin vehicle. | Confirms the SpaceX control-cabin image remains illustrative, not released construction drawings. Only the cabin panel belongs in this model. |
| [`unofficial-hls-cabin-cutaway.jpg`](screenshots/unofficial-hls-cabin-cutaway.jpg) | Fan cutaway shows a tall open nose/cabin, central cables, two bunks, lower utility deck, two low airlocks and garage/elevator below, plus an exterior silhouette. It claims 19.4 m³ for each airlock and roughly 604 m³ combined. | Useful inspiration for stacked rooms and accessible route. **Reject its airlock volume**: later SpaceX says about 13 m³ each. Do not treat its deck heights, bunk count or ECLSS placement as official. |
| [`unofficial-hls-interior-deck-plan-design-freedom.jpg`](screenshots/unofficial-hls-interior-deck-plan-design-freedom.jpg) | Explicitly unofficial 2021 sectional plan with five named levels: top docking, flight deck, crew pods and exercise machines, mess/social, science/storage and a two-zone EVA airlock. It includes dimensions and symbols, but depicts one airlock rather than the later two-airlock requirement. | Inspiration for missing habitation and exercise functions only. Do **not** copy its measurements, exact deck order, furniture count or single-airlock architecture. |

## 9. Source trace for published statements

The build instructions above carry all required facts; these links exist for later audit when public designs change:

- [SpaceX Starship HLS update](https://www.spacex.com/updates): two approximately 13 m³ airlocks and HLS development status.
- [SpaceX Moon page](https://www.spacex.com/humanspaceflight/moon/): crew-cabin art and combined habitable-volume statement.
- [NASA Engineering 2024 presentation](https://ntrs.nasa.gov/api/citations/20240011013/downloads/Artemis%20Status%202024%20240826.pdf): 50 m / 9 m older concept slide.
- [NASA OIG 2026 HLS audit](https://oig.nasa.gov/wp-content/uploads/2026/03/final-report-ig-26-004-nasas-management-of-the-human-landing-system-contracts.pdf): approximately 171 ft overall and approximately 115 ft elevator boarding height.
- [NASA 2022 Starship HLS capabilities slide](https://ntrs.nasa.gov/api/citations/20220015885/downloads/22%2010%2025%20ASCEND%20HLS%20Panel%20.pdf): sleeping/eating/hygiene, airlock dust, surface access and science functions.
- [NASA 2022 committee minutes](https://www.nasa.gov/wp-content/uploads/2023/10/heoc-oct-31-nov-1-2022-rev2.pdf): food and exercise-device planning, without a gym layout.
- [NASA HLS engineer interview, November 2026](https://www.nasa.gov/podcasts/houston-we-have-a-podcast/artemis-iii-paving-the-way-to-lunar-landings/): cabin/airlocks/garage relationship and approximate 22,000 ft³ volume.

For archive provenance, the original PDFs, page-addressable Markdown extracts and image credits are indexed in [`PDF_INDEX.md`](PDF_INDEX.md) and [`IMAGE_SOURCES.md`](IMAGE_SOURCES.md). The spec itself is sufficient to build the first model without opening them.
