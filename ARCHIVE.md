# Documentation Archive Policy

This project contains two documentation classes:

- **Canonical docs**: active instructions for current architecture and operations.
- **Archival docs**: historical notes from troubleshooting, migrations, and phased rollout logs.

## Canonical Source of Truth

Use `CURRENT_DOCS.md` to find canonical, current guidance.

If any archival note conflicts with canonical docs, canonical docs win.

## What Counts as Archival

Root-level files primarily used for historical context, such as:

- `*_SUMMARY.md`
- `*_REPORT.md`
- `*_ANALYSIS.md`
- `PHASE*.md`
- `*_FIX*.md`
- `*_STATUS*.md`

These files should be treated as snapshots of what happened at a point in time.

## Update Rules

- Do not rewrite historical incident timelines unless there is a factual correction.
- Add or update canonical guidance in canonical docs, not in archival files.
- When creating new incident/troubleshooting notes, include "Historical note" near the top.
