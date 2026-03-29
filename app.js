/* ============================================
   BurnerDrop — App Logic (Real IPFS + Crypto)
   ============================================ */



function initApp() {
    // ---- DOM REFS ----
    const dropZone     = document.getElementById('dropZone');
    const fileInput    = document.getElementById('fileInput');
    const browseLink   = document.getElementById('browseLink');
    const fileRow      = document.getElementById('fileRow');
    const fileIcon     = document.getElementById('fileIcon');
    const fileName     = document.getElementById('fileName');
    const fileMeta     = document.getElementById('fileMeta');
    const removeBtn    = document.getElementById('removeBtn');
    const sendBtn      = document.getElementById('sendBtn');
    const progressRow  = document.getElementById('progressRow');
    const progressFill = document.getElementById('progressFill');
    const progressPct  = document.getElementById('progressPct');
    const resultBox    = document.getElementById('resultBox');
    const cidField     = document.getElementById('cidField');
    const pwField      = document.getElementById('pwField');
    const copyCid      = document.getElementById('copyCid');
    const copyPw       = document.getElementById('copyPw');
    const tabSend      = document.getElementById('tabSend');
    const tabReceive   = document.getElementById('tabReceive');
    const panelSend    = document.getElementById('panelSend');
    const panelReceive = document.getElementById('panelReceive');
    const decryptBtn   = document.getElementById('decryptBtn');
    const recCid       = document.getElementById('recCid');
    const recPw        = document.getElementById('recPw');
    const toast        = document.getElementById('toast');
    const toastText    = document.getElementById('toastText');
    // Theme Toggle elements
    const themeToggle = document.getElementById('themeToggle');
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');
    
    // ---- THEME TOGGLE (Default: light) ----
    let savedTheme = 'light';
    try {
        savedTheme = localStorage.getItem('bd_theme') || 'light';
    } catch (e) {
        console.warn("localStorage access denied", e);
    }
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const nextTheme = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', nextTheme);
            try {
                localStorage.setItem('bd_theme', nextTheme);
            } catch (e) { /* ignore */ }
            updateThemeIcon(nextTheme);
        });
    }

    function updateThemeIcon(theme) {
        if (!moonIcon || !sunIcon) return;
        if (theme === 'dark') {
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        }
    }

    if (!tabSend || !tabReceive) {
        console.error("DOM not fully loaded");
        return;
    }

    let selectedFile = null;



    // ---- TABS ----
    tabSend.addEventListener('click', () => {
        tabSend.classList.add('active');
        tabReceive.classList.remove('active');
        panelSend.classList.remove('hidden');
        panelReceive.classList.add('hidden');
    });

    tabReceive.addEventListener('click', () => {
        tabReceive.classList.add('active');
        tabSend.classList.remove('active');
        panelReceive.classList.remove('hidden');
        panelSend.classList.add('hidden');
    });

    // ---- DRAG & DROP ----
    const stop = e => { e.preventDefault(); e.stopPropagation(); };
    ['dragenter','dragover','dragleave','drop'].forEach(ev => {
        dropZone.addEventListener(ev, stop);
        document.body.addEventListener(ev, stop);
    });
    ['dragenter','dragover'].forEach(ev =>
        dropZone.addEventListener(ev, () => dropZone.classList.add('drag-over'))
    );
    ['dragleave','drop'].forEach(ev =>
        dropZone.addEventListener(ev, () => dropZone.classList.remove('drag-over'))
    );
    dropZone.addEventListener('drop', e => {
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    dropZone.addEventListener('click', () => fileInput.click());
    browseLink.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
    fileInput.addEventListener('change', e => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    // ---- FILE ----
    function handleFile(file) {
        if (file.size > 10 * 1024 * 1024) { showToast('File exceeds 10 MB limit'); return; }
        selectedFile = file;
        const ext = file.name.split('.').pop().toUpperCase();
        fileName.textContent = file.name;
        fileMeta.textContent = fmtSize(file.size) + ' · ' + ext;
        setIcon(file.type, ext);
        fileRow.classList.remove('hidden');
        sendBtn.classList.remove('hidden');
        resultBox.classList.add('hidden');
        progressRow.classList.add('hidden');
        progressFill.style.width = '0%';
    }

    function setIcon(mime, ext) {
        fileIcon.className = 'file-icon';
        if (mime.startsWith('image/')) {
            fileIcon.classList.add('img');
            fileIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
        } else if (mime.startsWith('video/')) {
            fileIcon.classList.add('vid');
            fileIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`;
        } else if (['ZIP','RAR','7Z','TAR','GZ'].includes(ext)) {
            fileIcon.classList.add('zip');
            fileIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 8v13H3V3h12l6 5z"/><path d="M12 11v6"/><path d="M9 14h6"/></svg>`;
        } else {
            fileIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
        }
    }

    function fmtSize(b) {
        if (!b) return '0 B';
        const u = ['B','KB','MB','GB'];
        const i = Math.floor(Math.log(b) / Math.log(1024));
        return (b / Math.pow(1024, i)).toFixed(1) + ' ' + u[i];
    }

    // ---- REMOVE ----
    removeBtn.addEventListener('click', () => {
        selectedFile = null;
        fileRow.classList.add('hidden');
        sendBtn.classList.add('hidden');
        resultBox.classList.add('hidden');
        fileInput.value = '';
    });

    // ---- SEND / ENCRYPT (SIMULATED IPFS) ----
    sendBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        sendBtn.classList.add('hidden');
        progressRow.classList.remove('hidden');

        // Start progress animation (real progress is hard with fetch, so we animate)
        let pct = 0;
        const timer = setInterval(() => {
            // Slow down as we approach 90% — wait for real completion
            if (pct < 85) {
                pct += 0.8 + Math.random() * 1.5;
            } else if (pct < 95) {
                pct += 0.2;
            }
            pct = Math.min(pct, 95);
            progressFill.style.width = Math.floor(pct) + '%';
            progressPct.textContent = Math.floor(pct) + '%';
        }, 50);

        try {
            // REAL encryption + IPFS upload
            const { cid, password } = await packAndUpload(selectedFile);

            // Complete progress
            clearInterval(timer);
            progressFill.style.width = '100%';
            progressPct.textContent = '100%';

            // Show result
            setTimeout(() => {
                progressRow.classList.add('hidden');
                cidField.value = cid;
                pwField.value = password;
                resultBox.classList.remove('hidden');
            }, 400);

        } catch (err) {
            clearInterval(timer);
            progressRow.classList.add('hidden');
            sendBtn.classList.remove('hidden');
            console.error('[BurnerDrop] Encryption/upload failed:', err);
            showToast(`Error: ${err.message.replace('[BurnerDrop] ', '')}`);
        }
    });

    // ---- COPY BUTTONS ----
    [copyCid, copyPw].forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const field = document.getElementById(targetId);
            navigator.clipboard.writeText(field.value).then(() => {
                btn.classList.add('copied');
                btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
                const label = targetId === 'cidField' ? 'CID' : 'Password';
                showToast(`${label} copied to clipboard`);
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
                }, 2000);
            }).catch(() => {
                field.select();
                showToast('Press Ctrl+C to copy');
            });
        });
    });

    // ---- DECRYPT (REAL IPFS) ----
    let decryptAttempts = 0;

    decryptBtn.addEventListener('click', async () => {
        const cid = recCid.value.trim();
        const pw = recPw.value.trim();

        if (!cid || !pw) {
            showToast('Enter both CID and Password');
            return;
        }

        // Rate limiting
        if (decryptAttempts >= 5) {
            showToast('Too many attempts. Wait 30 seconds.');
            return;
        }
        decryptAttempts++;
        setTimeout(() => decryptAttempts--, 30000);

        decryptBtn.disabled = true;
        decryptBtn.innerHTML = `<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Decrypting...`;

        try {
            // REAL fetch from IPFS + decrypt
            const file = await fetchAndUnpack(cid, pw);

            showToast(`Decrypted: ${file.name} — downloading`);

            // Trigger browser download
            downloadFile(file);

            recCid.value = '';
            recPw.value = '';
        } catch (err) {
            console.error('[BurnerDrop] Decryption failed:', err);
            showToast(`Decryption failed: ${err.message.replace('[BurnerDrop] ', '')}`);
        } finally {
            decryptBtn.disabled = false;
            decryptBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Decrypt & Download`;
        }
    });

    // ---- TOAST ----
    let tt;
    function showToast(msg) {
        if (tt) clearTimeout(tt);
        toastText.textContent = msg;
        toast.classList.add('show');
        tt = setTimeout(() => toast.classList.remove('show'), 4000);
    }

    // Spinner CSS
    const s = document.createElement('style');
    s.textContent = `.spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`;
    document.head.appendChild(s);
}

// ----------------------------------------------------
// Initialization Logic
// ----------------------------------------------------
// Since this is an ES module (type="module" in index.html),
// it is deferred by default. Often, DOMContentLoaded has already
// fired by the time this script runs.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
