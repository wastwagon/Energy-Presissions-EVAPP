# Current Documentation Index

This file defines which docs describe the current architecture and operations.
Archival governance rules are defined in `ARCHIVE.md`.

## Canonical (Current) Docs

- `README.md`
- `QUICK_START.md`
- `DOCKER_SETUP.md`
- `LOCAL_URLS.md`
- `DEPLOYMENT_CHECKLIST.md`
- `backend/README.md`
- `frontend/README.md`

## Current Runtime Architecture

- Backend/API + OCPP: `csms-api` on port `3000`
- OCPP endpoint: `/ocpp/{chargePointId}`
- Frontend realtime (Socket.IO): `/ws`
- NGINX proxy entrypoint: port `8080`

## Archival/Historical Docs

Many root-level status/incident reports were written during migration and troubleshooting.
These are useful for history, but they are not normative setup guidance.

Treat files with names like these as historical snapshots unless explicitly referenced:

- `*_SUMMARY.md`
- `*_REPORT.md`
- `*_ANALYSIS.md`
- `PHASE*.md`
- `*_FIX*.md`
- `*_STATUS*.md`

When guidance conflicts, prefer the canonical docs listed above.
