# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within BurnerDrop, please report it responsibly.

**Do NOT open a public issue.**

Instead, send details to: **hawkeyedotexe@gmail.com**

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge your report within **48 hours** and work to resolve the issue promptly.

## Security Architecture

BurnerDrop is designed with a zero-trust model:

- **All encryption** happens client-side in the browser using the Web Crypto API (AES-256-GCM)
- **The server never sees** plaintext files, encryption keys, or unencrypted metadata
- **IPFS storage** ensures decentralized, tamper-proof data storage
- **No user accounts** — zero personal data is collected or stored
