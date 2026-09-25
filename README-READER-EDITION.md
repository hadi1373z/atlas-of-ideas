# Atlas of Ideas — Reader’s edition

An offline, dependency-free website for reading and connecting 118 mathematician and computer-scientist profiles. This edition improves the original interface without replacing its educational catalogue.

## Open the website

Open `index.html` in a current browser. No installation, account or build step is required. Only links to external sources need an internet connection. JavaScript must be enabled.

The standalone download, `atlas-of-ideas-reader-edition.html`, contains exactly the same website as this project's `index.html`.

## Bring your existing shelf

The storage key remains `atlas-of-ideas-v1`, and every profile identifier is unchanged. The original fields (`saved`, `read`, `notes`, `answers`, `interest`, `depth`, `theme`) are retained. This edition adds reader preferences, recent history and per-section reading positions.

On the same browser origin the old shelf is loaded automatically. Storage for local `file:` addresses varies by browser; renaming or moving an HTML file may give it a separate storage area. Do not assume that opening the new download carries your old notes over.

For a reliable move, open the **original website**, export its JSON backup from **My shelf**, then open the new edition and use **My shelf → Import → Merge**. Review the preview before applying it. Merge keeps your current and imported bookmarks/read marks. Different notes for the same person are joined with a labeled separator; importing the same note again does not append it twice. Replace mode is also available, but requires confirmation.

Keep a JSON backup before clearing browser data or switching browsers. Markdown export is useful for reading notes elsewhere but is not a restorable shelf backup. Notes are not synchronized to ChatGPT, a server or another device.

## Read and explore

- **Thinkers:** full-text search with excerpts, accents handled in names, field and shelf filters, grid/list views and sorting.
- **Reader:** adjustable article size, spacing, typeface and width; focus mode; live contents; shareable section links; equation expansion and notation/TeX copying where source TeX exists.
- **Continue reading:** scroll position is saved by section and relative offset. Opening a profile does not mark it read. Completion marks remain an explicit action.
- **Ideas:** 12 text-based indexes organize the existing collection around themes such as local/global structure, verification and approximation.
- **Connections:** browse the original 150 labeled links or find a shortest route between two people. Choose either-way exploration or arrows-only traversal. Reverse traversal is explicitly labeled; it does not reverse an historical influence claim.
- **Reading questions:** the original three questions remain on each profile. Selecting one suggests profiles by matching question terms to the catalogue and explains the match. This is local text matching, not an AI-generated answer.
- **Paths and timeline:** the original eight optional reading paths and all 118 birth-year entries remain available.
- **My shelf:** saved/read lists, recent history, private notes, JSON backup/import and Markdown export.

On small screens, the bottom bar exposes contents, notes, type settings and focus mode while reading. The graph is accompanied by its textual connection list. Page layouts reflow down to 320 CSS pixels; large mathematics can be expanded.

## Keyboard

`/` opens global search when not typing. In search, Up/Down move through results and Enter follows the selected result. Escape closes a dialog and returns focus. `F` toggles focus mode on a profile when not typing; Escape exits it. Tab and Shift+Tab stay inside open dialogs. All other controls use their normal browser keyboard behavior.

## Edit and rebuild

Python 3.10 or later is sufficient for the build; no third-party Python package is required.

```sh
python build.py
```

The build writes `index.html`. Deploy that single file to any static web host, or open it directly. Hash routes need no server-side rewrite rules.

Important files:

```text
index.html                    Ready-to-open standalone site
build.py                      Validates and embeds the source
src/catalogue.json            Authoritative original content, preserved byte-for-byte
src/exploration.json          New idea indexes and edition metadata
src/app.js                    UI, routing, search, graph, reading tools and storage
src/style.css                 Responsive light/dark design and print styles
src/template.html             Accessible page shell and build placeholders
src/build_data.py              Original editorial generator, retained for provenance
src/render_math.cjs            Optional original build-time MathJax renderer
src/source_overrides.json      Original source annotations
CHANGELOG.md                   Comparison with the actual previous implementation
docs/VERIFICATION.md           Checks, method, content hash and limitations
tests/test_site.py             UI regression suite (requires Playwright/Chromium)
tests/preview.py               Screenshot harness
previews/                     Screenshots of the built website
```

**Content editing:** edit `src/catalogue.json` directly, keeping existing IDs stable. For a new profile, supply the same fields as a nearby profile and add only documented connections. Edit `src/exploration.json` to change index descriptions and matching terms. Then run `python build.py`.

**Mathematics:** the finished page has no MathJax dependency. Existing equation SVGs are embedded in the JSON. Where stored `tex` and `mathSVG` exist, keep them synchronized with the human-readable `formula`/`math` field. `render_math.cjs` is the original optional generator and requires an external build-time MathJax installation; it is not needed for ordinary editing/building. Do not run `build_data.py` casually: it regenerates the old editorial snapshot and can overwrite direct catalogue edits. Back up the JSON before using either original generator. Only embed trusted SVG/content.

## Tests

The UI suite requires the Python Playwright package and Chromium. Its executable path defaults to `/usr/bin/chromium`. Adjust that path for another test environment. These packages are not runtime dependencies of the website.

```sh
python build.py
python tests/test_site.py
python tests/preview.py
```

The delivered verification report describes the actual sandbox method: URL navigation was blocked by browser policy, so the harness injects the real built HTML into a fresh page and supplies a test-only Web Storage implementation. It separately tests denied storage and undecodable legacy data. There are no test mocks in `index.html`.

## Content and scope

All 118 profiles, 150 connections and eight paths were preserved. There are 31 expanded profiles and 87 introductory portraits. This is an educational snapshot, not a complete biography collection or live research-status database. Historical claims, mathematical explanations and external references were not all independently reverified during the redesign.

There are no accounts, analytics, cloud uploads, remotely loaded fonts or background HTTP requests. The site has not been deployed to a public address. No scheduled daily-profile task is created or changed by this project.

The next useful deployment improvement is a stable hosted address: it makes sharing and mobile access easier and keeps the browser origin consistent between releases. Hosting alone does not synchronize notebooks between devices.
