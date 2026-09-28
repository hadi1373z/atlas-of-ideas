# Connected ideas · 28 September 2026

This edition adds Richard Hamming, Julia Robinson, and David Blackwell through five immutable `profile-edit` records, including expansions of Turing and Shannon. These are requested editorial updates, not scheduled daily articles.

The result has 121 thinkers and 159 connections. Nine connections are new. Five existing edges have expanded explanations, making fourteen source-linked editorial connection notes. The notes explicitly classify documented supervision, research lineage, mathematical equivalence, mathematical connections, and thematic comparisons. The original catalogue bytes and original endpoint/label triples remain unchanged.

Six existing idea lenses now have explanatory essays, six original SVG diagrams, and twelve thematic bridges: computation, information, learning, verification, approximation, and symmetry. The diagrams continue the reader's paper, line, and node style. They are original explanatory constructions, not reproductions of source figures or historical portraits. Captions state the examples' assumptions. All artwork is inline and works offline; narrow screens provide keyboard-accessible horizontal scrolling for legible labels.

## Editing and validation

- Profile changes still belong in `content/updates/` under the existing revision and identity contract. Never edit an accepted event.
- `content/connection-notes.json` is an editorial overlay. Each entry must match an existing `(source, target, label)` triple and include a classification, explanation, and public sources. It does not create edges. New edges belong in profile update records.
- Idea explanations, captions, sources, and bridges are in `src/exploration.json`; fixed illustration markup is in `src/app.js`. Public profile records still cannot inject SVG or HTML.
- `src/enrichment.py` checks the overlay, source URLs, illustration names, and idea bridge endpoints during every build. The canonical catalogue and event replay remain protected by `tools/catalogue.py`.
- Build output uses explicit UTF-8 bytes so Windows newline translation cannot invalidate the published checksum. `.gitattributes` protects source line endings on fresh checkouts.

Run `python -m unittest discover -s tests -p 'test_publish.py' -v`, `python build.py`, and `node --check src/app.js`. The tests include full article archival, new endpoint integrity, invalid source rejection, and dangling idea/connection rejection. Existing browser scripts contain baseline-only count assumptions and a Linux browser path; this edition was additionally exercised through the actual local browser preview.

Historical and mathematical references appear beside the content they support. The worked examples (repetition code, hidden-bit experiment, bounded/unbounded search, Hamiltonian certificate, five-cycle cut, and relabeled four-cycle) are deliberately small illustrations, not substitutes for the cited theorems.
