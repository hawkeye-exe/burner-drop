// Share-link helpers. The AES key travels in the URL fragment (#...), which
// browsers never send to servers, so neither our API nor the IPFS gateway sees it.

const CID_PATTERN = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,})$/;

export function isValidCid(cid: string): boolean {
  return CID_PATTERN.test(cid);
}

/** Standard base64 key -> compact base64url token. */
export function keyToToken(base64Key: string): string {
  return base64Key.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Token -> standard base64 key. Accepts the base64url token used in links and
 * the legacy grouped password format ("aX4k-mR9q-...", with ~ for + and _ for /).
 */
export function tokenToKey(token: string): string {
  let value = token.trim();
  const isLegacy = /^[A-Za-z0-9~_]{4}(-[A-Za-z0-9~_]{1,4})+$/.test(value);
  if (isLegacy) {
    value = value.replace(/-/g, "").replace(/~/g, "+").replace(/_/g, "/");
  } else {
    value = value.replace(/-/g, "+").replace(/_/g, "/");
  }
  while (value.length % 4 !== 0) value += "=";
  return value;
}

/** Human-friendly password for split-channel sharing (groups of 4). */
export function tokenToPassword(token: string): string {
  return (token.match(/.{1,4}/g) || [token]).join(" ");
}

export function buildShareLink(origin: string, cid: string, token: string): string {
  return `${origin}/d/${cid}#${token}`;
}

/** Parse a pasted share link ("https://host/d/<cid>#<token>"). */
export function parseShareLink(input: string): { cid: string; token: string } | null {
  const match = input.trim().match(/\/d\/([A-Za-z0-9]+)#([A-Za-z0-9_~-]+)/);
  if (!match || !isValidCid(match[1])) return null;
  return { cid: match[1], token: match[2] };
}

export function normalizePassword(input: string): string {
  // Spaces are only cosmetic grouping.
  return input.replace(/\s+/g, "");
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}
