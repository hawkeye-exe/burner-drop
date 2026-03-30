const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const METADATA_HEADER_LENGTH = 4;

const managedKeyStore = new WeakMap<CryptoKey, string>();

type FileMetadata = {
  name: string;
  type: string;
};

function getSubtleCrypto(): SubtleCrypto {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Web Crypto API is unavailable.");
  }

  return window.crypto.subtle;
}

function getBrowserCrypto(): Crypto {
  if (typeof window === "undefined" || !window.crypto) {
    throw new Error("Web Crypto API is unavailable.");
  }

  return window.crypto;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    combined.set(part, offset);
    offset += part.byteLength;
  }

  return combined;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function encodeMetadata(metadata: FileMetadata): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(metadata));
}

function decodeMetadata(bytes: Uint8Array): FileMetadata {
  const decoded = JSON.parse(new TextDecoder().decode(bytes));

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof decoded.name !== "string" ||
    typeof decoded.type !== "string"
  ) {
    throw new Error("Invalid encrypted file metadata.");
  }

  return decoded;
}

function createManagedKey(rawKeyBytes: Uint8Array): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();

  return subtle.importKey("raw", toArrayBuffer(rawKeyBytes), ALGORITHM, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function generateEncryptionKey(): Promise<CryptoKey> {
  const crypto = getBrowserCrypto();
  const rawKeyBytes = crypto.getRandomValues(new Uint8Array(KEY_LENGTH));
  const key = await createManagedKey(rawKeyBytes);

  managedKeyStore.set(key, bytesToBase64(rawKeyBytes));

  return key;
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const exportedKey = managedKeyStore.get(key);

  if (!exportedKey) {
    throw new Error("Key cannot be exported.");
  }

  return exportedKey;
}

export async function importKey(keyStr: string): Promise<CryptoKey> {
  const rawKeyBytes = base64ToBytes(keyStr);

  if (rawKeyBytes.byteLength !== KEY_LENGTH) {
    throw new Error("Invalid AES-256-GCM key length.");
  }

  const key = await createManagedKey(rawKeyBytes);

  managedKeyStore.set(key, keyStr);

  return key;
}

const MAX_METADATA_SIZE = 1024 * 1024; // 1MB limit for metadata

export async function encryptFileWithMetadata(
  file: File,
  key: CryptoKey,
): Promise<Blob> {
  const crypto = getBrowserCrypto();
  const subtle = getSubtleCrypto();
  const metadataBytes = encodeMetadata({ name: file.name, type: file.type });

  if (metadataBytes.byteLength > MAX_METADATA_SIZE) {
    throw new Error("File metadata is too large to encrypt.");
  }

  const metadataLengthBytes = new Uint8Array(METADATA_HEADER_LENGTH);

  new DataView(metadataLengthBytes.buffer).setUint32(
    0,
    metadataBytes.byteLength,
    true,
  );

  const fileBytes = new Uint8Array(await file.arrayBuffer());
  const payload = concatBytes(metadataLengthBytes, metadataBytes, fileBytes);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = new Uint8Array(
    await subtle.encrypt(
      { name: ALGORITHM, iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(payload),
    ),
  );

  return new Blob([iv, ciphertext], {
    type: "application/octet-stream",
  });
}

export async function decryptFileWithMetadata(
  blob: Blob,
  key: CryptoKey,
): Promise<{ file: File }> {
  const subtle = getSubtleCrypto();
  const encryptedBytes = new Uint8Array(await blob.arrayBuffer());

  if (encryptedBytes.byteLength <= IV_LENGTH) {
    throw new Error("Encrypted payload is too short.");
  }

  const iv = encryptedBytes.slice(0, IV_LENGTH);
  const ciphertext = encryptedBytes.slice(IV_LENGTH);
  const decryptedBytes = new Uint8Array(
    await subtle.decrypt(
      { name: ALGORITHM, iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(ciphertext),
    ),
  );

  if (decryptedBytes.byteLength < METADATA_HEADER_LENGTH) {
    throw new Error("Decrypted payload is too short.");
  }

  const metadataLength = new DataView(
    decryptedBytes.buffer,
    decryptedBytes.byteOffset,
    decryptedBytes.byteLength,
  ).getUint32(0, true);
  const metadataStart = METADATA_HEADER_LENGTH;
  const metadataEnd = metadataStart + metadataLength;

  if (metadataLength > MAX_METADATA_SIZE || metadataEnd > decryptedBytes.byteLength) {
    throw new Error("Encrypted metadata length is invalid or too large.");
  }

  const metadata = decodeMetadata(
    decryptedBytes.slice(metadataStart, metadataEnd),
  );
  const fileBytes = decryptedBytes.slice(metadataEnd);
  const file = new File([fileBytes], metadata.name, { type: metadata.type });

  return { file };
}
