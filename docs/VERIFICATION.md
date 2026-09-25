# Verification of the Reader’s edition

## Content preservation

The original and new `src/catalogue.json` files have the same SHA-256:

```
dcb96d1176a98b77da8c723bb9b47415f4fd455c163f36312a5bda85a443d4cd
```

The catalogue contains 118 unique people, 31 expanded profiles, 87 short portraits, 150 labeled connections, nine fields and eight reading paths. Every original article section and source link was compared with the rendered profile in the browser suite. All endpoints and new idea-index starting profiles refer to existing IDs.

## Automated UI checks

`tests/test-report.json` records 17 passing groups of regression checks. The suite exercises the actual built standalone HTML, not separate component substitutes.

It covers every profile route; full-text/name search and filters; global keyboard search; deep links and resume; reading preferences; focus mode and dialog containment/return; offline equations; note escaping and persistence; question suggestions; all idea indexes, paths and timeline entries; map selection and zoom; shortest routes checked against a separate BFS; JSON and Markdown export contents; preview/merge/replace imports; invalid backup rejection; denied storage; and protection against overwriting malformed stored data.

Layout checks found no horizontal page overflow at 1440, 1024, 768, 390 or 320 CSS pixels across 13 page types. All 118 profiles were also tested at 320 pixels. Mobile contents/settings/navigation and the largest reader size were exercised. Reduced motion and print-specific hiding of personal notes were checked.

No uncaught JavaScript errors or background HTTP requests were observed during the suite. `node --check src/app.js` also completed successfully. A final focused pass verified active contents and resume in the notes/questions/sources sections, and the enlarged mobile graph at four widths.

## Visual inspection

Screenshots were made from the real `index.html` in Chromium. Desktop home, reader, focus view, dark theme, search/library, idea indexes and map/route view were inspected. Mobile home, reader equations and route/map layouts were also inspected. Final mobile map typography was enlarged after reviewing the first screenshot.

## Testing environment and limits

The sandbox's administrator policy prevented normal URL navigation, including a direct file opening. A fresh `about:blank` page was therefore populated with the built HTML. A test-only Web Storage implementation allowed the application's real migration, save and import logic to run. Separate unmodified/denied-storage cases confirmed the warning and session-only behavior. No test mock is included in the delivered page.

This verifies UI behavior and storage logic; it does not verify persistence in the user's browser, across native `file:` locations, across devices, or on a live host. The real user's local notebook was not accessed. Only representative legacy test backups were used.

Native clipboard permissions, download prompts and operating-system print dialogs can vary. Exported Blob contents and print CSS were checked; operating-system integrations were not certified. There was no independent accessibility conformance audit, manual screen-reader audit, or Safari/Firefox/device-lab run.

All original educational material and external references were retained. Mathematical proofs, historical statements and current link availability were not all independently rechecked. The new thematic indexes and reading suggestions are explicitly labeled as catalogue navigation, not evidence of historical influence.

## Run it again

From the project directory, with Python Playwright and Chromium installed:

```
python build.py
python tests/test_site.py
python tests/preview.py
```

The harness currently uses `/usr/bin/chromium`; change this path for a different environment. The normal site has no Python, Playwright, Node or network dependency.
