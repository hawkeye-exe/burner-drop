# Changelog

All notable changes to this project are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/), versioning follows [SemVer](https://semver.org/).

## [0.2.0] - 2026-10-06

### Added
- **One-link sharing**: senders get a single `https://<host>/d/<cid>#<key>` link. The key lives in the URL fragment and is never sent to any server.
- `/d/[cid]` recipient page: fetches ciphertext from IPFS, decrypts in-browser, shows file name/size and a Download button.
- Receive tab accepts either a full share link or a CID + password pair (**Split Mode**).
- `GET /api/health` endpoint reporting storage configuration (`pinata` / `unconfigured`); UI banner when storage is not configured.
- `503` response from `/api/upload` when storage is not configured.
- GitHub Actions CI (lint + build on Node 22).
- `docs/07-api.md` HTTP API reference.

### Changed
- README: How It Works diagram, route table, documentation index.
- Architecture and security-model docs updated for the URL-fragment key design and threat model.

## [0.1.0]

### Added
- Client-side AES-256-GCM encryption with embedded file metadata.
- Pinata IPFS upload route with size limit and ephemeral salted-IP rate limiting.
- Docker, Vercel and Netlify deployment; env-based whitelabeling.
