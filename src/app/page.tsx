"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  generateEncryptionKey,
  exportKey,
  importKey,
  encryptFileWithMetadata,
  decryptFileWithMetadata,
} from "../lib/crypto";

// Simulated IPFS Store (In-Memory)
const mockIPFS = new Map<string, Blob>();

function generateMockCID() {
  return "bafkrei" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function BurnerDropApp() {
  // Theme State
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // App States
  const [activeTab, setActiveTab] = useState<"SEND" | "RECEIVE">("SEND");
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ cid: string; pw: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Receive States
  const [recCid, setRecCid] = useState("");
  const [recPw, setRecPw] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Theme
  useEffect(() => {
    let saved = "light";
    try {
      saved = localStorage.getItem("bd_theme") || "light";
    } catch (e) {
        console.warn(e);
    }
    setTheme(saved as "light" | "dark");
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    try {
      localStorage.setItem("bd_theme", nextTheme);
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied!");
    } catch (err) {
      showToast("Failed to copy");
    }
  };

  // --- SEND HANDLERS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
      setProgress(0);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // The actual mock upload sequence using their crypto library
  const handleEncryptAndSend = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(10);

    try {
      // 1. Generate Key
      setProgress(30);
      const cryptoKey = await generateEncryptionKey();
      const exportedKeyStr = await exportKey(cryptoKey);

      // 2. Encrypt File
      setProgress(50);
      const encryptedBlob = await encryptFileWithMetadata(file, cryptoKey);

      // 3. Mock Upload to IPFS
      setProgress(80);
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network
      const cid = generateMockCID();
      mockIPFS.set(cid, encryptedBlob);

      setProgress(100);
      
      // We format the exported base64 key slightly for user readability
      let formattedPw = exportedKeyStr.replace(/\+/g, "x").replace(/\//g, "z").replace(/=/g, "");
      const chunks = formattedPw.match(/.{1,4}/g) || [formattedPw];
      const finalPw = chunks.join("-");

      setResult({ cid, pw: finalPw });
    } catch (err: any) {
      console.error(err);
      alert("Encryption failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RECEIVE HANDLERS ---
  const handleDecryptAndDownload = async () => {
    if (!recCid || !recPw) {
      alert("CID and Password are required");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Unformat password back to typical base64 output style
      let rawBase64 = recPw.replace(/-/g, "");
      rawBase64 = rawBase64.replace(/x/g, "+").replace(/z/g, "/");
      while (rawBase64.length % 4 !== 0) rawBase64 += "=";

      // 2. Import Key
      const cryptoKey = await importKey(rawBase64);

      // 3. Fetch from Mock IPFS
      await new Promise((resolve) => setTimeout(resolve, 600)); // network delay
      const encryptedBlob = mockIPFS.get(recCid);
      if (!encryptedBlob) {
        throw new Error("File not found on the simulated IPFS network.");
      }

      // 4. Decrypt 
      const { file: decryptedFile } = await decryptFileWithMetadata(encryptedBlob, cryptoKey);

      // 5. Download
      downloadBlob(decryptedFile, decryptedFile.name);
      showToast("Decrypted!");
      setRecCid("");
      setRecPw("");
    } catch (err: any) {
      console.error(err);
      alert("Decryption Failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-grid"></div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-inner">
          <div className="brand-wrap">
            <div className="brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="brand">
              Burner<span className="brand-accent">Drop</span>
            </span>
          </div>
          <div className="nav-right">
            <span className="nav-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              AES-256 Encrypted
            </span>
            <button className="config-btn" onClick={toggleTheme} title="Toggle Theme">
              <svg className={`moon-icon ${theme === "dark" ? "hidden" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              <svg className={`sun-icon ${theme === "light" ? "hidden" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="main">
        <div className="container">
          {/* Hero */}
          <section className="hero">
            <div className="hero-badge">🔐 Zero-Trust File Transfer · Powered by IPFS</div>
            <h1 className="hero-title">
              Send files with
              <br />
              <span className="gradient-text">double encryption</span>
            </h1>
            <p className="hero-desc">
              Every file gets a unique <strong>CID</strong> and <strong>Password</strong>. Both are required to decrypt — so even if one leaks, your file stays safe.
            </p>
            <div className="hero-features">
              <div className="feature">
                <div className="feature-num">1</div>
                <span>Upload your file</span>
              </div>
              <div className="feature-arrow">→</div>
              <div className="feature">
                <div className="feature-num">2</div>
                <span>Get CID + Password</span>
              </div>
              <div className="feature-arrow">→</div>
              <div className="feature">
                <div className="feature-num">3</div>
                <span>Share securely</span>
              </div>
            </div>
          </section>

          {/* Card */}
          <section className="card">
            <div className="card-tabs">
              <button
                className={`tab ${activeTab === "SEND" ? "active" : ""}`}
                onClick={() => setActiveTab("SEND")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Send
              </button>
              <button
                className={`tab ${activeTab === "RECEIVE" ? "active" : ""}`}
                onClick={() => setActiveTab("RECEIVE")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Receive
              </button>
            </div>

            {/* SEND PANEL */}
            {activeTab === "SEND" && (
              <div className="panel">
                {!file && (
                  <div
                    className="drop-zone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="drop-inner">
                      <div className="drop-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <p className="drop-text">
                        Drag & drop files here, or <span className="browse-link">browse</span>
                      </p>
                      <p className="drop-hint">Max 10 MB · No sign-up needed</p>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} hidden />
                  </div>
                )}

                {/* File Preview */}
                {file && !result && (
                  <div className="file-row">
                    <div className="file-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-meta">
                        {formatSize(file.size)} · {file.type || "Unknown Type"}
                      </span>
                    </div>
                    {!isProcessing && (
                      <button className="remove-btn" onClick={clearFile} aria-label="Remove">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {/* Progress */}
                {isProcessing && !result && (
                  <div className="progress-row">
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-pct">{progress}%</span>
                  </div>
                )}

                {/* Send Button */}
                {file && !result && (
                  <button className="btn-action" onClick={handleEncryptAndSend} disabled={isProcessing}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    {isProcessing ? "Encrypting..." : "Encrypt & Send"}
                  </button>
                )}

                {/* RESULT */}
                {result && (
                  <div className="result">
                    <div className="result-header">
                      <div className="result-check">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div>
                        <p className="result-title">Encrypted & uploaded to IPFS!</p>
                        <p className="result-sub">Share both credentials with the receiver</p>
                      </div>
                    </div>

                    <div className="credential cid-credential">
                      <div className="cred-label">
                        <div className="cred-badge cid-badge">CID</div>
                        <span className="cred-label-text">IPFS Content Identifier</span>
                      </div>
                      <div className="cred-row">
                        <input type="text" className="cred-input" readOnly value={result.cid} />
                        <button className="copy-btn" onClick={() => copyToClipboard(result.cid)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="credential pw-credential">
                      <div className="cred-label">
                        <div className="cred-badge pw-badge">KEY</div>
                        <span className="cred-label-text">Decryption Password</span>
                      </div>
                      <div className="cred-row">
                        <input type="text" className="cred-input" readOnly value={result.pw} />
                        <button className="copy-btn" onClick={() => copyToClipboard(result.pw)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="result-warn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      Both CID and Password are required to decrypt. Never share them in the same message.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RECEIVE PANEL */}
            {activeTab === "RECEIVE" && (
              <div className="panel">
                <p className="receive-desc">Enter both the CID and Password to decrypt and download your file.</p>

                <div className="receive-field">
                  <label className="field-label">
                    <span className="cred-badge cid-badge sm">CID</span>
                    Content Identifier
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. bafkrei..."
                    value={recCid}
                    onChange={(e) => setRecCid(e.target.value)}
                  />
                </div>

                <div className="receive-field">
                  <label className="field-label">
                    <span className="cred-badge pw-badge sm">KEY</span>
                    Decryption Password
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. aX4k-mR9q-bL2w-pN7j..."
                    value={recPw}
                    onChange={(e) => setRecPw(e.target.value)}
                  />
                </div>

                <button className="btn-action btn-green" onClick={handleDecryptAndDownload} disabled={isProcessing}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  {isProcessing ? "Decrypting..." : "Decrypt & Download"}
                </button>
              </div>
            )}
          </section>

          {/* Trust bar */}
          <div className="trust-bar">
            <div className="trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              E2E Encrypted
            </div>
            <div className="trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              No Tracking
            </div>
            <div className="trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Zero Knowledge
            </div>
            <div className="trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              IPFS Storage
            </div>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toastMsg && (
        <div className="toast visible">
          <span>{toastMsg}</span>
        </div>
      )}
    </>
  );
}
