# Reader’s edition — 2.0

## Preserved

The previous implementation was inspected, including its HTML, app source, styling, catalogue and build tools. It already provided search/filtering, profile articles, SVG mathematics, a connections map, timeline, reading paths, bookmarks, read marks, notes, backup/import, light/dark appearance and an offline build. These were retained rather than presented as new features.

`src/catalogue.json` is byte-for-byte identical to the original. All 118 people, their IDs, article sections, notes prompts/questions, source entries, 150 connection labels/descriptions and eight paths remain intact. A duplicate impact paragraph on some short portraits is displayed once rather than repeated; the data was not removed.

## Reading is now the primary interface

Added a three-column desktop reading layout with live contents, a readable article measure and related-person/theme links. Focus mode removes surrounding chrome. Article size, line spacing, serif/sans selection and width are adjustable and persistent. Typography and focus changes retain the current reading section.

Scroll position is saved as a section plus relative offset. Continue-reading and recent-history actions restore it. Reading progress does not alter explicit completion marks. Every section can be linked directly.

Existing offline equation SVGs can now be expanded. The viewer includes copyable plain notation and stored TeX when available. Printing a profile hides personal notes and interactive controls.

## Exploration has reasons, not arbitrary jumps

Full-text search now highlights matches, shows the surrounding section excerpt and links directly to the matching section. A global keyboard search dialog works from any page.

Twelve idea indexes group relevant existing content. They use documented local matching rules rather than claiming new historical relationships.

The connections map now supports shortest routes between two people. Every step shows the recorded label, explanation and original direction. An explicit arrows-only option distinguishes historical traversal from thematic browsing.

The old three-question recommendation routine picked a nearby person by list position. It now scores terms from the actual question against profile content, with light weighting for existing links and unread profiles, and explains the matching terms. A selected question can be added to the personal notebook.

## Notebook compatibility and safety

Retained `atlas-of-ideas-v1` and the original state fields. New fields are additive. Version-1 JSON backups are supported.

Added an import preview, merge mode, deduplication of repeated imported notes and a separate confirmed replace action. Invalid backups do not replace existing data. Corrupt stored JSON is not silently overwritten. When storage is blocked the site keeps session state and visibly recommends export. Added Markdown notebook export alongside JSON backup.

## Visual and accessibility improvements

Reworked the editorial layout, navigation, spacing, field treatments, interactive home graphic, dark appearance and mobile presentation. A mobile reading dock gives direct access to contents, notes, settings and focus mode. Mobile graph labels and hit areas are enlarged.

Added visible keyboard focus, native dialogs with explicit Tab/Shift+Tab containment and focus return, labeled controls, keyboard search, route-heading focus, skip-to-content and reduced-motion handling. The graph has a textual equivalent. These changes have been tested, but are not a claim of audited WCAG conformance.

## Boundaries

No backend, sign-in, cloud sync, public hosting or scheduling integration was introduced. No live rewrite of the mathematical catalogue was attempted. The deliverable includes editable source and a verification report, including browser-environment limitations.

## 2026-09-25 — GitHub Pages publication preparation

- Retained the actual Reader's Edition and unchanged 118-profile catalogue.
- Added append-only public profile/correction records, canonical identity checks, idempotent daily-date keys and stale-revision protection.
- Added full public article archives, a publication journal and dynamic catalogue counts.
- Added reproducible Pages artifact build, public manifests/index/profile JSON and exact-byte live verification.
- Added main-branch Pages workflow and read-only pull-request validation.
- Added a one-time owner-computer GitHub publisher, persistent editing instructions and JSON schema.
- Updated the existing daily task's prompt for the integration without changing its schedule. Remote writes and deployment remain blocked by the connector's actual 403 responses; see docs/DEPLOYMENT-STATUS.md.
- Re-ran 22 publishing tests, 17 original browser regression groups and six new publication browser groups.
