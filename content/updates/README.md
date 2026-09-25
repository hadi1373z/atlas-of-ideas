# Append-only public updates

One validated JSON record per public profile or correction. Filename = `event_id.json`.
Do not put reader notes, chat transcripts, credentials, personal preferences, or screenshots here.

Daily IDs are `daily-YYYY-MM-DD` (Prague date); retries reuse the exact same ID.
Existing person IDs never change. A correction is a new `profile-edit` record, not an overwrite of history.
Read `docs/PUBLISHING.md` and `schemas/update.schema.json` first.
