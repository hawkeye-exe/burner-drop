<div align="center">
  <img src="public/logo.png" width="120" alt="BurnerDrop Logo" style="border-radius:20px; margin-bottom: 20px;" />
  <h1>BurnerDrop</h1>
  <p><b>Zero-Trust, Privacy-First, Client-Side Encrypted File Sharing</b></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Next.js 16](https://img.shields.io/badge/Next.js-16.2.1-black?logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
  [![IPFS](https://img.shields.io/badge/Storage-IPFS-65C2CB?logo=ipfs)](https://ipfs.tech/)
  [![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://hub.docker.com/)
</div>

<div align="center">
  <h3>One-Click Deploy</h3>

  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhawkeye-exe%2Fburner-drop&env=PINATA_JWT&envDescription=Your%20Pinata%20API%20JWT%20for%20IPFS%20storage&project-name=burnerdrop&repository-name=burner-drop)
  [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/hawkeye-exe/burner-drop)
</div>

<br />

> **BurnerDrop** is a decentralized file drop system. Files are encrypted in the browser before they ever touch the network. **We can route the files, but we can't see them.**

---

## ✨ Features

- **Double Encryption**: Files are given a unique IPFS Content Identifier (CID) and an AES-256-GCM decryption password. Both are required to access the file.
- **Zero-Knowledge Architecture**: Encryption happens entirely client-side using the Web Crypto API. The server never sees the raw file, the encryption key, or the unencrypted metadata.
- **Decentralized Storage**: Encrypted blobs are pinned directly to the IPFS network via Pinata, ensuring high availability and censorship resistance.
- **Lossless Key Management**: Robust base64 implementation ensures keys are perfectly preserved during the URL/Password sharing phase.
- **Beautiful UI/UX**: Custom-designed, premium interface with fluid animations, drag-and-drop support, and built-in dark mode.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A [Pinata](https://pinata.cloud/) API JWT

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hawkeye-exe/burner-drop.git
   cd burner-drop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   PINATA_JWT="your_pinata_jwt_here"
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ System Architecture

BurnerDrop operates on a strict separation of concerns, ensuring that the server infrastructure acts only as a blind relay for encrypted data. 

### Upload Pipeline
1. Files are read directly in the user's browser.
2. Metadata (filename, mime-type) is packed into a unified binary format.
3. The entire payload is encrypted using **AES-256-GCM** via the browser's native Web Crypto API.
4. The resulting ciphertext is sent to our Next.js API route.
5. The API route extracts the sender's IP for **SHA-256 hashed rate-limiting** and verifies the payload size (max 50MB).
6. It filters the request, sanitizes potential error returns, and forwards the blind binary data to the Pinata IPFS network.

### Retrieval Pipeline
1. When a recipient is given the share credentials (CID and Password), the application extracts the details.
2. It fetches the ciphertext from IPFS via gateway fallbacks.
3. Once retrieved, the payload is decrypted client-side.
4. The metadata is unpacked, and the original file is reconstructed and offered for download.

---

## 🛡️ Security & Privacy Engineering

- **Zero-Log Infrastructure**: We do not store files, keys, or metadata on our servers. Even IPs used for rate-limiting are hashed via SHA-256 with an ephemeral salt.
- **Server-Side Secret Masking**: Infrastructure secrets like Pinata JWTs are injected securely on the backend; they never leak to the client.
- **Security Hardening**:
  - **API Sanitization**: All backend errors are intercepted and sanitized to prevent internal architecture disclosure.
  - **Metadata Protection**: Strict 1MB limit on encrypted metadata headers to prevent memory exhaustion attacks.
  - **Dependency Integrity**: Regular automated audits to ensure 0 known vulnerabilities in the dependency tree.
- **Edge Security Headers**: We enforce strict HTTPS, HSTS, X-Frame-Options, and no-sniff headers to prevent downgrade attacks and content spoofing.

---

## 🚧 Limitations

- **Upload Limits**: Individual file payloads are capped at **10MB** in the browser for optimal client-side performance. The API route supports up to **50MB** for final encrypted packages.
- **IPFS Immutability**: Once an encrypted payload is pinned to IPFS, it cannot be traditionally "deleted." Security relies strictly on the mathematical guarantee of the AES-256-GCM encryption.

---

## 🐳 Self-Hosting

### Docker (Recommended)

```bash
git clone https://github.com/hawkeye-exe/burner-drop.git
cd burner-drop

# Add your Pinata JWT
echo "PINATA_JWT=your_jwt_here" > .env.local

# Build and run
docker compose up -d
```

BurnerDrop will be available at `http://localhost:3000`.

### Manual

```bash
npm install
npm run build
npm start
```

---

## 🧩 Modular SDK — Build Your Own Frontend

BurnerDrop's crypto engine (`src/lib/crypto.ts`) is a **standalone, framework-agnostic module** that runs in any browser environment. You can import it into React, Vue, Svelte, vanilla JS, React Native (with Web Crypto polyfill), or any platform that supports the Web Crypto API.

### Exported Functions

| Function | Description |
|---|---|
| `generateEncryptionKey()` | Generates a cryptographically strong random **AES-256 (32 bytes)** key. |
| `exportKey(key)` | Exports a `CryptoKey` to a URL-safe base64 string for easy sharing. |
| `importKey(base64Str)` | Decodes and imports a base64 string back into a standard `CryptoKey`. |
| `encryptFileWithMetadata(file, key)` | Encrypts a `File` (including name/MIME type) into a single secured `Blob`. |
| `decryptFileWithMetadata(blob, key)` | Decrypts a `Blob` back into the original `File` with full name/type restoration. |

### Usage Example (Vanilla JS)

```js
import { generateEncryptionKey, exportKey, importKey,
         encryptFileWithMetadata, decryptFileWithMetadata } from './crypto';

// Encrypt
const key = await generateEncryptionKey();
const password = await exportKey(key);
const encryptedBlob = await encryptFileWithMetadata(myFile, key);
// Upload encryptedBlob to any storage backend

// Decrypt (on another device)
const key2 = await importKey(password);
const { file } = await decryptFileWithMetadata(encryptedBlob, key2);
// file.name, file.type, and contents are fully restored
```

### API Route (`POST /api/upload`)

The backend accepts a `multipart/form-data` request with a single `file` field and forwards it to Pinata IPFS. Returns `{ IpfsHash }` on success.

```bash
curl -X POST -F "file=@encrypted-payload.bin" https://your-domain.com/api/upload
# {"IpfsHash": "Qm...", "PinSize": 1234, "Timestamp": "..."}
```

---

<div align="center">
  <i>Built with 🔒 for the Hackathon by the Hawkeye Team</i>
</div>
