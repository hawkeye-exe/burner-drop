# BURNER DROP: Secure Client-Side Encrypted File Sharing

> Zero-trust, privacy-first, client-side encrypted decentralized file drop system. We can drop the files, but we can't see them.

## System Architecture

Burner Drop operates on a strict separation of concerns, ensuring that the server infrastructure acts only as a blind relay for encrypted data. 

**Upload Pipeline**: Files are read directly in the user's browser, metadata is packed into a unified binary format, and the entire payload is encrypted using AES-256-GCM via the Web Crypto API. The resulting ciphertext is sent to our Next.js API route. The API route verifies the payload size and applies rate limiting before forwarding the blind data to the Pinata IPFS network.

**Retrieval Pipeline**: When a recipient accesses the share link, the application extracts the decryption key from the URL hash fragment (which is never sent to the server). It then fetches the ciphertext from IPFS via multiple gateway fallbacks. Once retrieved, the payload is decrypted client-side, the metadata is unpacked, and the original file is reconstructed and offered for download.

## Security & Privacy Engineering

- **Zero-Log Architecture**: We do not store files, keys, or metadata on our servers. The infrastructure only processes and relays encrypted binary blobs.
- **Ephemeral Rate Limiter**: IP addresses used for rate limiting are immediately hashed with an ephemeral salt generated at server startup. Raw IPs are never stored, preventing historical traffic analysis.
- **Server-Side Secret Masking**: Infrastructure secrets like Pinata JWTs are injected securely on the backend.
- **Edge Middleware**: We enforce strict HTTPS, HSTS, X-Frame-Options, and no-sniff headers to prevent downgrade attacks and content spoofing.

## Limitations

- **50MB Barrier**: To ensure reliable processing and mitigate abuse, individual file payloads are currently hard-capped at 50MB.
- **In-Memory Rate Limit State**: Rate limiting is tracked in memory per node. In distributed edge environments, users routed across different nodes may temporarily bypass local limits.
- **IPFS Immutability**: Once an encrypted payload is pinned to IPFS, it cannot be traditionally "deleted." Instead, security relies on the mathematical guarantee of the AES-256-GCM encryption.

## Future Possibilities

- **Chunked Uploading**: Implementing multi-part uploads to bypass the 50MB restriction for large files.
- **Redis Rate Limit**: Migrating from node-local memory maps to a globally synchronized Redis instance for precise rate limiting across edge regions.
- **Smart Contract Expirations**: Integrating decentralized timers to automatically unpin content after a predetermined duration.
- **User Auth & DID Integration**: Exploring Decentralized Identifiers (DIDs) to establish verifiable sender identities without compromising the zero-trust architecture.
