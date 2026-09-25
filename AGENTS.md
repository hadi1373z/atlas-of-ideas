# Atlas of Ideas: public editing and publishing contract

Target: `hadi1373z/atlas-of-ideas`, branch `main`, GitHub Pages only.
Read `docs/PUBLISHING.md` before editing or delivering a daily profile.

- Keep the actual Reader's Edition UI and original catalogue. `src/catalogue.json` is a protected baseline, not an upload scratchpad.
- Add public articles and corrections as `content/updates/<event_id>.json`. Use the current profile revision, stable person IDs and normalized identity checking. Never overwrite a previous event.
- Exactly one `daily-YYYY-MM-DD` event per scheduled Prague date, regardless of which person was chosen. A retry must be an identical no-op, not a second profile. Corrections are separate edit events.
- Before selecting the next daily person, inspect the current `catalogue-index.json` on the hosted site and the conversation. `already_profiled` prevents repeats; short unprofiled catalogue introductions may be expanded. No fixed order.
- Put the complete public article and three questions in `article_markdown`, not a teaser. The structured `profile.sections` must carry the same substantive explanation. Use public citations, not internal chat citation markers. Keep mathematical hypotheses and conditional results accurate.
- UI/code changes belong in `src/`, with verification. Rebuild; do not edit only the generated HTML. Do not force-push or overwrite changes made since your read.
- No private notes, bookmarks, reading progress, research preferences, personal messages, credentials, raw conversations, or scheduled-task identifiers belong in this public repository.
- Do not add another independent profile-generating cron job: the existing conversation task is the generator; GitHub Actions is only the validator/builder/publisher.
- A commit is not a deployment. Verify `version.json` and actual site content. Report committed/pending/failed/verified accurately.
- If repository access fails, say exactly what failed, keep the daily article behavior, and attach the prepared public update record. Never claim an uncommitted record was queued remotely.
