# Atlas of Ideas — Reader's Edition / GitHub Pages

This is the actual Reader's Edition source, plus a duplicate-safe public update pipeline. It starts with **118 people, 150 labeled connections and eight reading paths**. The original catalogue and browser-note identifiers are retained.

**Repository:** https://github.com/hadi1373z/atlas-of-ideas

**Intended Pages address:** https://hadi1373z.github.io/atlas-of-ideas/

Do not treat an intended address as a verified deployment. The exact preparation-time limitation is recorded in `docs/DEPLOYMENT-STATUS.md`; a deployment is verified by `tools/verify_live.py` and the workflow's verify job.

## Use locally

Open `index.html` in a browser. It is still one self-contained, offline-capable HTML file. No JavaScript framework, server, external font or runtime mathematics CDN is needed.

## Build and test

Python 3.10+ (standard library only) builds the site and runs the publishing tests:

```sh
python -m unittest discover -s tests -p 'test_publish.py' -v
python build.py
```

`_site/` is the Pages artifact; `index.html` is the standalone edition. The website itself needs neither Python nor installation.

## One-time publishing

Preferred: authorize the connected GitHub application for this repository, including the permissions actually needed to write content and workflow files. Reading a public repository or seeing admin permission on your account does not prove the app can write.

If using your computer instead, the supplied standard-library Python bootstrap uploads all allowlisted source files atomically, configures Pages through GitHub's API, dispatches the Pages workflow and checks the deployed bytes. It uses your authenticated GitHub CLI; it never asks you to paste a token into ChatGPT.

```sh
gh auth login --hostname github.com
gh auth refresh -h github.com -s workflow
python tools/publish_github.py
```

On Windows with the Python launcher, use `py` instead of `python`. GitHub CLI must be installed first. The publisher does not require a separate Git installation. It refuses to overwrite an already populated repository; use the normal incremental workflow once bootstrap has succeeded.

Preview the upload file list without network access or writes:

```sh
python tools/publish_github.py --dry-run
```

In the GitHub UI the required publishing-source setting is **Repository Settings -> Pages -> Build and deployment -> Source: GitHub Actions**. The bootstrap script configures this automatically if its local credential has the required permissions. No custom domain or paid host is needed.

## Automatic profiles and conversational edits

The existing daily conversation task remains the author. It writes **one public content record** to `content/updates/`. A main-branch push validates, builds, deploys and verifies the site. GitHub does not independently generate another article and cannot read your conversations.

Read **[docs/PUBLISHING.md](docs/PUBLISHING.md)** and **[AGENTS.md](AGENTS.md)** for exact authoring/commit/verification instructions. The authoritative schema is `schemas/update.schema.json`, with stronger replay and identity checks in `tools/catalogue.py`.

- Daily date keys prevent repeated task runs from producing duplicate articles.
- Canonical IDs plus normalized names/aliases prevent creating a second entry for the same person.
- Revision checks prevent stale corrections from overwriting newer content.
- The complete delivered article is archived; the reader shows the current formatted profile and a publication journal.
- Schema, identity or revision failures stop publication. A commit alone is never reported as a live update.

This integration is prepared in code; its actual end-to-end status must be checked against the repository and live manifest. Changing an automation's instructions is not proof that a future write or deployment has succeeded.

## Your notes remain private and local

Website publishing is not note synchronization. Nothing here uploads browser notes, read marks, questions or bookmarks to GitHub or ChatGPT.

Before switching from the old downloaded HTML to the hosted site, **export the old JSON backup**, then use **My shelf -> Import -> Merge** on the new site. The storage key is still `atlas-of-ideas-v1`, and existing person IDs are unchanged. A different origin/file address or another device may not see your previous local storage.

## Project map

```
src/                         Actual Reader's Edition source and unchanged baseline catalogue
content/updates/             Append-only public profile/correction records
tools/catalogue.py           Validation, deterministic replay, identity and revision protection
tools/ingest.py              Local idempotent ingestion
tools/publish_github.py      One-time authenticated bootstrap (no Git required)
tools/verify_live.py         Exact-byte and manifest verification
.github/workflows/pages.yml Build -> Pages -> verify on main pushes
.github/workflows/validate.yml Read-only PR checks
schemas/update.schema.json  Public update format
docs/PUBLISHING.md           Persistent daily-task and conversational-edit contract
README-READER-EDITION.md     Original reader documentation/provenance
```

No full historical chat export or private reader data is included. The older original profiles are edited learning articles rather than verbatim historical chat transcripts; this pipeline does not retroactively manufacture those transcripts.
