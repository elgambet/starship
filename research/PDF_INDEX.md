# LLM index for the archived PDFs

Start with the [project analysis](../README.md) for reconciled measurements. The files in [`sources-md/`](sources-md/) contain the complete extractable text of each archived PDF, split by **PDF page number**. Search them with `rg`; open the original PDF or matching screenshot for diagrams, photographs, tables and visual context.

| Question | Relevant Markdown page | Original visual reference | Interpretation |
| --- | --- | --- | --- |
| What habitability functions does NASA list for HLS? | [PDF page 9: sleeping/eating/hygiene](sources-md/nasa-hls-capabilities-2022.md#pdf-page-9) | [NASA HLS capability slide](screenshots/nasa-2022-hls-habitability-slide.png) | Identifies relevant functions, not a Starship-specific cabin-room drawing. |
| Is there an older overhead view of a Starship HLS airlock? | [PDF page 13: initial HLS progress](sources-md/nasa-artemis-science-hls-progress-2022.md#pdf-page-13) | [NASA 2022 airlock/elevator/VR slide](screenshots/nasa-2022-hls-airlock-overhead.png) | Photograph of an early airlock mockup, not a current two-airlock layout. |
| Has NASA republished the multi-level crew-cabin concept? | [PDF page 11: Artemis III HLS progress](sources-md/nasa-artemis-iii-progress-2026.md#pdf-page-11) | [NASA 2026 slide](screenshots/nasa-2026-hls-cabin-progress-slide.png) | Calls the cabin image an artist's illustration; no dimensions or other room plan. |
| What were the stated HLS height and outside diameter in NASA's 2024 Engineering presentation? | [PDF page 34: 50 m high, 9 m diameter](sources-md/nasa-engineering-hls-specs-2024.md#pdf-page-34) | [Specification slide](screenshots/nasa-engineering-2024-hls-specifications.png) | Earlier published concept; current NASA material commonly uses about 52 m. |
| Where does the older 22 m upper-region figure come from? | [PDF page 3: 50 m total and 22 m upper region](sources-md/nasa-ntrs-starship-hls-2024.md#pdf-page-3) | [Annotated diagram](screenshots/nasa-2024-hls-dimensions-slide.png) | Adapted older concept; 22 m is not a confirmed cabin height. The number may be present only in the graphic, so inspect the screenshot. |
| What physical airlock and elevator mockups were tested? | [PDF page 4: airlock photo](sources-md/nasa-ntrs-hls-update-2025.md#pdf-page-4); [PDF page 5: cabin, elevator, suit integration](sources-md/nasa-ntrs-hls-update-2025.md#pdf-page-5) | [Airlock test page](screenshots/nasa-2025-airlock-test.png) | Full-scale mockup/testing evidence, without released hatch or room dimensions. |
| What does the 2026 audit say about total height? | [PDF page 30: about 171 ft](sources-md/nasa-oig-hls-2026.md#pdf-page-30) | [Relative scale figure](screenshots/nasa-oig-2026-height-elevator.png) | Approximately 52 m; not a tolerance drawing. |
| How high is the elevator area? | [PDF page 31: about 115 ft above ground](sources-md/nasa-oig-hls-2026.md#pdf-page-31) | [Audit page and figure](screenshots/nasa-oig-2026-height-elevator.png) | Approximately 35.1 m. Exact platform geometry is not given. |

The official **600+ m³ combined pressurized volume** and **two approximately 13 m³ airlocks** come from [SpaceX's HLS update](https://www.spacex.com/updates) and [Moon page](https://www.spacex.com/humanspaceflight/moon/), which are web pages rather than PDFs. The [NASA HLS engineer interview](https://www.nasa.gov/podcasts/houston-we-have-a-podcast/artemis-iii-paving-the-way-to-lunar-landings/) is another web source for the vertical cabin/airlock/garage relationship and an approximate 22,000 ft³ interior-volume statement.

## Recreate the Markdown extracts

From the project root, run `python3 research/convert_pdfs.py`. The script needs Poppler's `pdftotext` command. It uses raw text order and preserves page boundaries; it does not interpret figures or silently invent missing text.
