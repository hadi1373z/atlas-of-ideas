# Public profile updates and conversational site edits

## Architecture

The existing conversation's **Influential Thinker Daily** task remains the author at **21:00 Europe/Prague**. There is no second authoring job on GitHub and no API in this site that reads ChatGPT chats.

The intended flow is:

```
Existing ChatGPT daily task / authorized edit request
    -> one small, validated public JSON record (or a reviewed src/ code edit)
    -> commit to hadi1373z/atlas-of-ideas:main
    -> GitHub Actions: validate -> build -> Pages deploy -> HTTP verification
    -> current profile + publication journal + immutable archived article
```

This flow is implemented in the source, but is operational only after the repository is populated, GitHub Pages is enabled with source **GitHub Actions**, and the writer has repository write permission. Check `docs/DEPLOYMENT-STATUS.md` for the actual preparation-time result, not a promise of deployment.

## Canonical sources and migration

`src/catalogue.json` is the unchanged original 118-person Reader's Edition catalogue. Its SHA-256 is checked on every build. The 150 original links, eight paths and profile identifiers are not removed by the update system.

Later content is an append-only set of files in `content/updates/`. `tools/catalogue.py` replays those records by UTC timestamp and event ID. Every edit checks the exact previous profile revision. A conflicting/stale edit fails the build; it does not silently overwrite someone else's change.

The browser storage key stays `atlas-of-ideas-v1`. Existing per-person note keys stay unchanged. These facts preserve notebook compatibility on the same origin, not cross-device synchronization. To move from a downloaded HTML file to Pages, export the old site's JSON backup, then **My shelf -> Import -> Merge** on the hosted edition. All sites under one `hadi1373z.github.io` origin share origin storage; this application does not share it with other sites or the repository.

## Read state before writing

Read this document and:

- `https://hadi1373z.github.io/atlas-of-ideas/catalogue-index.json` — canonical IDs, names/aliases, current profile revisions, already-profiled flags, event and source keys.
- `https://hadi1373z.github.io/atlas-of-ideas/profiles/<person-id>.json` — full current public profile when modifying an existing entry.
- `https://hadi1373z.github.io/atlas-of-ideas/version.json` — deployed build, source commit and accepted event IDs.

If the site is unavailable, read the repository and run `python build.py` to reconstruct those files under `_site/`. Do not use a stale deployed revision while a newer update to that person is committed but not yet published. Inspect repository update files or rebuild the latest source first.

The original 31 expanded profiles are marked `already_profiled`; the 87 short introductions are not all treated as previously delivered daily articles. New daily records add their canonical person ID to that set. Also check the available conversation history for a profile not yet in the website.

## Daily profile record

Use **Prague's scheduled date**, not an assumed UTC date. For example, a run for 2026-09-26 uses event ID `daily-2026-09-26`, source key `daily:2026-09-26`, filename `content/updates/daily-2026-09-26.json`. These IDs do not include the person's name, so a retried run cannot publish a second person for the same day.

Choose someone using the latest real user preferences, not a fixed sequence. The body still introduces who they were, the actual breakthrough, its mathematical substance and influence, and ends with exactly three substantive research-direction questions.

A record has these fields:

```json
{
  "schema_version": 1,
  "event_id": "daily-2026-09-26",
  "source_key": "daily:2026-09-26",
  "created_at": "2026-09-26T19:00:00Z",
  "kind": "daily-profile",
  "person_id": "existing-canonical-id-or-new-slug",
  "base_revision": null,
  "summary": "A public, factual summary of the new article.",
  "profile": {},
  "connections_add": [],
  "article_markdown": "The COMPLETE delivered public article, with public source URLs and all three questions."
}
```

This is a structural illustration, not a valid ready-to-submit article. Fill `profile` as below. For an existing entry use the current 64-character SHA-256 `revision`; `null` is valid only for a genuinely new person. Never guess a hash. A revision is SHA-256 of the complete current profile serialized as UTF-8 JSON with sorted keys, compact separators and unescaped Unicode. The build/index supplies it directly.

`created_at` is the real UTC creation time in `YYYY-MM-DDTHH:MM:SSZ` form. Do not copy the example timestamp. Later edits must order after the version they edit.

For a **new** person provide: `name`, integer `born`, `field`, `title`, `bio`, `formula` (readable Unicode/plain text), `impact`, `sections`, `sources`, and `questions`.

Optional fields: `aliases`, `extended` (default true), `approximateBirth` (default false), `readMinutes` (default 5), `qualification`, `tex`, `ref`.

The nine field IDs are `geometry`, `analysis`, `algebra`, `logic`, `systems`, `information`, `complexity`, `graphs`, and `algorithms`.

Each section has `title`, `text`, and optional `math` and `tex`. Use separate paragraphs in `text` divided by blank lines. Include the complete mathematical explanation, not a compressed biography. The offline reader displays plain/Unicode equations and offers TeX copying. New records may not inject HTML or SVG. Existing pre-rendered equations remain intact; changing their formula invalidates a stale SVG automatically.

Each source has `label`, `url` and optional `type`. Source URLs must be public HTTP(S), without credentials. Use real sources consulted for the article. A connection has exactly `source`, `target`, `label`, and `description`; endpoints must exist and the description must distinguish conceptual reading links from documented influence.

`article_markdown` preserves the actual full public article, not a private conversation. In the website, the formatted current profile is primary; the journal exposes the preserved plain-text article from each publication.

For a correction use kind `profile-edit`, a fresh `edit-...` event ID, a unique source key starting `edit:`, the current `base_revision`, and only changed fields in `profile`. Omitted fields survive. Never change a person's canonical ID to change their spelling. Add aliases instead where appropriate. Old archive text is not silently rewritten by a correction.

## Commit procedure for an assistant

Use actual connected GitHub actions and read their results:

1. Check whether the event filename already exists. If it is byte/JSON-equivalent, reuse it and verify deployment; this is a successful retry, not a new write. If different, do not overwrite it. Reconcile with the user request and create a separate correction event where justified.
2. Validate locally against the current source whenever available: `python tools/ingest.py update.json`, `python -m unittest discover -s tests -p 'test_publish.py' -v`, `python build.py`.
3. Create the one UTF-8 JSON file using the GitHub contents API on **main**. Do not recreate the catalogue, template or whole repository for each daily article. Use its returned commit SHA as evidence of commitment only.
4. The push-triggered Pages workflow builds and deploys. There is no need to modify the daily schedule or issue an extra profile-generating task.
5. Verify the event is present in the live `version.json`, that `profiles/<id>.json` contains the intended full content, and ideally run `python tools/verify_live.py --event <event-id>`. An update may be included in a newer commit alongside other edits, so the event ID is the durable verification key.
6. Return the daily article with a truthful publication status: **verified on the website**, **committed; deployment pending**, or **not published, blocked by ...**.

If code or design changes are requested conversationally, fetch the latest relevant source files and their SHAs, make the requested changes in `src/`, test and commit them. Preserve the update journal and baseline. Every main-branch push invokes the same deployment workflow. This works only when that conversation/run has the authenticated connector capabilities; it is not a global listener to every message in every chat.

## Failure and security behavior

A 403/401 is a permission/authentication error, not evidence that a write succeeded. Do not retry through unrelated repositories, publish credentials, force-push, or turn off branch protection. Save the prepared public JSON locally as an attachment and report that it has **not** reached GitHub. On a later authorized retry use exactly the same daily key.

A failed validation leaves the last successful Pages deployment unchanged. There is no silent “best effort” partial catalogue update. Content records are data, never executable workflow code. Only repository writers can commit. No public issue or comment can execute arbitrary build commands. PR validation runs read-only and does not deploy.

The workflow uploads only `_site/`, not tokens, notebooks, the working directory, or private test data. It does not commit generated files back with `GITHUB_TOKEN`; GitHub suppresses most recursive triggers from that token, so deployment occurs directly in this same workflow instead.

## Current GitHub setup references

- GitHub Pages publishing sources: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Pages REST configuration/permissions: https://docs.github.com/en/rest/pages/pages
- GitHub App repository permissions: https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app
- Workflow trigger behavior: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow
