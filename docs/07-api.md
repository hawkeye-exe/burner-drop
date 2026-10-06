# HTTP API Reference

BurnerDrop exposes two route handlers. Neither ever receives plaintext or keys.

## `POST /api/upload`

Relays an already-encrypted payload to Pinata (IPFS).

**Request** — `multipart/form-data` with a single field:

| Field | Type | Description |
|---|---|---|
| `file` | binary | Ciphertext produced by `encryptFileWithMetadata()` |

```bash
curl -X POST -F "file=@encrypted-payload.bin" https://burner-drop.vercel.app/api/upload
```

**200 OK** — the Pinata pin response:

```json
{ "IpfsHash": "bafy...", "PinSize": 1234, "Timestamp": "2026-10-06T14:40:00.000Z" }
```

The client builds the share link as `https://<host>/d/<IpfsHash>#<key>`.

**Errors** — all return `{ "error": "<message>" }`:

| Status | Meaning |
|---|---|
| `400` | No `file` field in the form data |
| `413` | Payload exceeds `MAX_UPLOAD_SIZE_MB` (platform body limits may apply first, e.g. ~4.5 MB on Vercel functions) |
| `429` | Rate limit exceeded for this (hashed) IP |
| `500` | Upstream Pinata error or unexpected failure |
| `503` | Storage not configured (`PINATA_JWT` missing) |

## `GET /api/health`

Reports whether a storage backend is configured. The UI calls this on load and shows a banner when uploads would fail.

```bash
curl https://burner-drop.vercel.app/api/health
```

```json
{ "ok": true, "storage": "pinata" }
```

| Field | Values |
|---|---|
| `ok` | Always `true` if the server is up |
| `storage` | `"pinata"` when `PINATA_JWT` is set, otherwise `"unconfigured"` |

## Retrieval

There is no download API. Recipients fetch ciphertext directly from an IPFS gateway (`NEXT_PUBLIC_IPFS_GATEWAY`, default `https://gateway.pinata.cloud`) and decrypt in the browser on `/d/[cid]`.
