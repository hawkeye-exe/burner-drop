"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { importKey, decryptFileWithMetadata } from "@/lib/crypto";
import { formatSize, isValidCid, tokenToKey } from "@/lib/share";

const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud";
const FALLBACK_GATEWAY = "https://ipfs.io";

type Status =
  | { kind: "loading"; step: string }
  | { kind: "ready"; file: File }
  | { kind: "error"; message: string };

async function fetchCiphertext(cid: string): Promise<Blob> {
  for (const gateway of [IPFS_GATEWAY, FALLBACK_GATEWAY]) {
    try {
      const res = await fetch(`${gateway}/ipfs/${cid}`);
      if (res.ok) return await res.blob();
    } catch {
      // try next gateway
    }
  }
  throw new Error("File not found on IPFS. It may still be propagating — try again in a minute.");
}

export default function DropPage() {
  const params = useParams<{ cid: string }>();
  const cid = params.cid;
  const [status, setStatus] = useState<Status>({ kind: "loading", step: "Reading link…" });

  useEffect(() => {
    let cancelled = false;
    const token = window.location.hash.slice(1);

    (async () => {
      try {
        if (!isValidCid(cid)) throw new Error("This link has an invalid file identifier.");
        if (!token) throw new Error("This link is missing its decryption key (the part after #).");

        const key = await importKey(tokenToKey(token)).catch(() => {
          throw new Error("The decryption key in this link is malformed.");
        });
        if (cancelled) return;
        setStatus({ kind: "loading", step: "Fetching encrypted file from IPFS…" });
        const blob = await fetchCiphertext(cid);
        if (cancelled) return;
        setStatus({ kind: "loading", step: "Decrypting in your browser…" });
        const { file } = await decryptFileWithMetadata(blob, key).catch(() => {
          throw new Error("Decryption failed — the key does not match this file.");
        });
        if (!cancelled) setStatus({ kind: "ready", file });
      } catch (err) {
        if (!cancelled) {
          setStatus({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cid]);

  const download = () => {
    if (status.kind !== "ready") return;
    const url = URL.createObjectURL(status.file);
    const a = document.createElement("a");
    a.href = url;
    a.download = status.file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <div className="bg-grid"></div>
      <nav className="navbar">
        <div className="nav-inner">
          <Link href="/" className="brand-wrap">
            <img src="/logo.png" alt="Logo" width={32} height={32} style={{ borderRadius: "8px" }} />
            <span className="brand">BurnerDrop</span>
          </Link>
          <div className="nav-right">
            <span className="nav-chip">Decrypted locally</span>
          </div>
        </div>
      </nav>
      <main className="main">
        <div className="container">
          <section className="hero">
            <div className="hero-badge">🔐 Someone sent you an encrypted file</div>
            <h1 className="hero-title">
              {status.kind === "ready" ? "Your file is ready" : status.kind === "error" ? "Can't open this drop" : "Opening drop…"}
            </h1>
          </section>
          <section className="card">
            <div className="panel">
              {status.kind === "loading" && (
                <div className="progress-row">
                  <div className="progress-track">
                    <div className="progress-fill progress-indeterminate" style={{ width: "40%" }}></div>
                  </div>
                  <span className="progress-pct">{status.step}</span>
                </div>
              )}

              {status.kind === "ready" && (
                <>
                  <div className="file-row">
                    <div className="file-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div className="file-info">
                      <span className="file-name">{status.file.name}</span>
                      <span className="file-meta">
                        {formatSize(status.file.size)} · {status.file.type || "Unknown type"}
                      </span>
                    </div>
                  </div>
                  <button className="btn-action btn-green" onClick={download}>
                    Download file
                  </button>
                  <p className="receive-desc">
                    Integrity verified with AES-256-GCM. The key never left your browser.
                  </p>
                </>
              )}

              {status.kind === "error" && (
                <>
                  <div className="result-warn">{status.message}</div>
                  <Link href="/" className="btn-action btn-new">
                    Go to BurnerDrop
                  </Link>
                </>
              )}
            </div>
          </section>
          <div className="trust-bar">
            <div className="trust-item">CID: {cid.slice(0, 10)}…{cid.slice(-6)}</div>
          </div>
        </div>
      </main>
    </>
  );
}
