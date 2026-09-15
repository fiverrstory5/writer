// ==========================================================================
// Voice Typing & TTS Studio — Unified Dual Workspace Application Logic
// ==========================================================================

// Global DOM Elements
const splitContainer = document.getElementById('splitContainer');
const paneWriter = document.getElementById('paneWriter');
const paneReader = document.getElementById('paneReader');
const splitter = document.getElementById('splitter');
const btnCollapseLeft = document.getElementById('btnCollapseLeft');
const btnCollapseRight = document.getElementById('btnCollapseRight');
const btnModeWriter = document.getElementById('btnModeWriter');
const btnModeSplit = document.getElementById('btnModeSplit');
const btnModeReader = document.getElementById('btnModeReader');
const btnSendToReader = document.getElementById('btnSendToReader');
const toastMessage = document.getElementById('toastMessage');

// Writer DOM Elements
const writerEditor = document.getElementById('writerEditor');
const writerScrollContainer = document.getElementById('writerScrollContainer');
const btnWriterMic = document.getElementById('btnWriterMic');
const micIcon = document.getElementById('micIcon');
const micLabel = document.getElementById('micLabel');
const selectMicLang = document.getElementById('selectMicLang');
const btnOpenRules = document.getElementById('btnOpenRules');
const btnCloseRules = document.getElementById('btnCloseRules');
const modalOverlay = document.getElementById('modalOverlay');
const rulesListContainer = document.getElementById('rulesListContainer');
const inputFrom = document.getElementById('inputFrom');
const inputTo = document.getElementById('inputTo');
const selectRuleMode = document.getElementById('selectRuleMode');
const btnAddRule = document.getElementById('btnAddRule');
const rulesCountBadge = document.getElementById('rulesCountBadge');
const btnExportRules = document.getElementById('btnExportRules');
const btnImportRules = document.getElementById('btnImportRules');
const fileImportRules = document.getElementById('fileImportRules');
const confirmOverlay = document.getElementById('confirmOverlay');
const confirmTitle = document.getElementById('confirmTitle');
const confirmDesc = document.getElementById('confirmDesc');
const btnConfirmCancel = document.getElementById('btnConfirmCancel');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');
const btnWriterCopy = document.getElementById('btnWriterCopy');
const btnWriterDownload = document.getElementById('btnWriterDownload');
const btnWriterClear = document.getElementById('btnWriterClear');
const lblWordCount = document.getElementById('lblWordCount');
const lblCharCount = document.getElementById('lblCharCount');
const lblWriterStatus = document.getElementById('lblWriterStatus');
const floatingMenu = document.getElementById('floatingMenu');
const btnFloatCopy = document.getElementById('btnFloatCopy');
const btnFloatPaste = document.getElementById('btnFloatPaste');
const btnFloatDelete = document.getElementById('btnFloatDelete');

// Reader DOM Elements
const readerEditor = document.getElementById('readerEditor');
const readerScrollContainer = document.getElementById('readerScrollContainer');
const btnReaderPaste = document.getElementById('btnReaderPaste');
const btnReaderClear = document.getElementById('btnReaderClear');
const btnReaderToggleClean = document.getElementById('btnReaderToggleClean');
const cleanIcon = document.getElementById('cleanIcon');
const cleanLabel = document.getElementById('cleanLabel');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const readerScrollResumePill = document.getElementById('readerScrollResumePill');
const btnPrev = document.getElementById('btnPrev');
const btnPlayPause = document.getElementById('btnPlayPause');
const btnNext = document.getElementById('btnNext');
const lblTime = document.getElementById('lblTime');
const lblCounter = document.getElementById('lblCounter');
const lblReaderStatus = document.getElementById('lblReaderStatus');
const trackBar = document.getElementById('trackBar');
const trackFill = document.getElementById('trackFill');

// --------------------------------------------------------------------------
// 1. Toast Notification Helper
// --------------------------------------------------------------------------
let toastTimer = null;
function showToast(msg) {
    if (!toastMessage) return;
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.textContent = msg;
    toastMessage.classList.add('show');
    toastTimer = setTimeout(() => {
        toastMessage.classList.remove('show');
    }, 2400);
}

// --------------------------------------------------------------------------
// 2. Resizable Splitter & Layout Mode Controls
// --------------------------------------------------------------------------
let isDragging = false;
let currentSplitRatio = 50; // percentage for writer pane
let currentMode = 'split';  // 'split' | 'writer-only' | 'reader-only'

function loadSavedLayout() {
    try {
        const savedRatio = localStorage.getItem('studio_split_ratio');
        if (savedRatio) {
            const parsed = parseFloat(savedRatio);
            if (!isNaN(parsed) && parsed >= 15 && parsed <= 85) {
                currentSplitRatio = parsed;
            }
        }
        const savedMode = localStorage.getItem('studio_layout_mode');
        if (savedMode && ['split', 'writer-only', 'reader-only'].includes(savedMode)) {
            setMode(savedMode);
        } else {
            applySplitRatio(currentSplitRatio);
        }
    } catch (e) {
        applySplitRatio(50);
    }
}

function applySplitRatio(pct) {
    currentSplitRatio = Math.max(18, Math.min(82, pct));
    if (currentMode === 'split') {
        paneWriter.style.width = `${currentSplitRatio}%`;
        paneReader.style.width = `${100 - currentSplitRatio}%`;
    }
}

function saveSplitRatio() {
    try {
        localStorage.setItem('studio_split_ratio', String(currentSplitRatio));
    } catch (e) {}
}

function setMode(mode) {
    currentMode = mode;
    splitContainer.classList.remove('mode-writer-only', 'mode-reader-only');
    btnModeWriter.classList.remove('active');
    btnModeSplit.classList.remove('active');
    btnModeReader.classList.remove('active');

    if (mode === 'writer-only') {
        splitContainer.classList.add('mode-writer-only');
        btnModeWriter.classList.add('active');
        paneWriter.style.width = '100%';
        paneReader.style.width = '0%';
    } else if (mode === 'reader-only') {
        splitContainer.classList.add('mode-reader-only');
        btnModeReader.classList.add('active');
        paneWriter.style.width = '0%';
        paneReader.style.width = '100%';
    } else {
        // Split mode
        btnModeSplit.classList.add('active');
        applySplitRatio(currentSplitRatio);
    }

    try {
        localStorage.setItem('studio_layout_mode', mode);
    } catch (e) {}
}

// Splitter Dragging Listeners
splitter.addEventListener('mousedown', (e) => {
    if (e.target.closest('.splitter-collapse-btn')) return;
    isDragging = true;
    document.body.classList.add('is-resizing');
    splitter.classList.add('active');
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const rect = splitContainer.getBoundingClientRect();
    if (rect.width <= 0) return;
    const clientX = e.clientX;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    applySplitRatio(pct);
});

window.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        document.body.classList.remove('is-resizing');
        splitter.classList.remove('active');
        saveSplitRatio();
    }
});

// Touch Events for Splitter
splitter.addEventListener('touchstart', (e) => {
    if (e.target.closest('.splitter-collapse-btn')) return;
    isDragging = true;
    document.body.classList.add('is-resizing');
    splitter.classList.add('active');
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    if (!isDragging || !e.touches.length) return;
    const rect = splitContainer.getBoundingClientRect();
    if (rect.width <= 0) return;
    const clientX = e.touches[0].clientX;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    applySplitRatio(pct);
}, { passive: true });

window.addEventListener('touchend', () => {
    if (isDragging) {
        isDragging = false;
        document.body.classList.remove('is-resizing');
        splitter.classList.remove('active');
        saveSplitRatio();
    }
});

// Double click splitter to reset 50:50
splitter.addEventListener('dblclick', (e) => {
    if (e.target.closest('.splitter-collapse-btn')) return;
    if (currentMode !== 'split') setMode('split');
    applySplitRatio(50);
    saveSplitRatio();
    showToast('Split reset to 50:50');
});

// Mode buttons
btnModeWriter.addEventListener('click', () => setMode('writer-only'));
btnModeSplit.addEventListener('click', () => setMode('split'));
btnModeReader.addEventListener('click', () => setMode('reader-only'));

// Collapse buttons on splitter
btnCollapseLeft.addEventListener('click', (e) => {
    e.stopPropagation();
    setMode('reader-only');
});
btnCollapseRight.addEventListener('click', (e) => {
    e.stopPropagation();
    setMode('writer-only');
});

// --------------------------------------------------------------------------
// 3. Workflow Bridge: "Send to Reader ➔"
// --------------------------------------------------------------------------
function sendWriterTextToReader() {
    const rawText = writerEditor.innerText || '';
    if (!rawText.trim()) {
        showToast('Writer is empty. Speak or type first!');
        return;
    }

    // If currently in Writer-only mode, switch to Split mode so user can see Reader
    if (currentMode === 'writer-only') {
        setMode('split');
    }

    // Stop voice typing punctuation timer if running
    finalizeSentencePunctuation();

    // Ingest into Reader & start reading aloud immediately
    handleReaderPastedText(rawText);
    showToast('Sent to Reader ➔ Playing audio');
}

btnSendToReader.addEventListener('click', sendWriterTextToReader);

// --------------------------------------------------------------------------
// 4. WRITER (Voice Typing Studio Engine)
// --------------------------------------------------------------------------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;
let interimSpan = null;
let punctuationTimer = null;
let pendingDeleteCallback = null;
let savedSelectionRange = null;
const PAUSE_DURATION_MS = 4000;

// 1-Minute Silence Auto-Stop & Clear Protection State
let silenceTimer = null;
let lastSpeechTimestamp = 0;
const SILENCE_TIMEOUT_MS = 60 * 1000; // 60 seconds silence
let clearConfirmTimeout = null;

// Auto-Replace Dictionary State
const STORAGE_KEY = 'voice_typing_studio_rules';
const DEFAULT_RULES = [
    { to: 'Python', from: ['पायथन', 'पाइथन', 'पाईथन'], mode: 'auto' },
    { to: 'WhatsApp', from: ['वॉट्सएप', 'व्हाट्सएप', 'वाट्सएप'], mode: 'auto' },
    { to: 'Google', from: ['गूगल'], mode: 'auto' },
    { to: 'YouTube', from: ['यूट्यूब', 'युटुब', 'युट्यूब'], mode: 'auto' },
    { to: 'Facebook', from: ['फेसबुक', 'फेस बुक'], mode: 'auto' },
    { to: 'Computer', from: ['कंप्यूटर', 'कम्प्यूटर'], mode: 'auto' },
    { to: 'GST', from: ['जीएसटी'], mode: 'suggest' }
];
let replacementRules = [];

function normalizeRules(rules) {
    if (!Array.isArray(rules)) return [];
    return rules.map(r => {
        let fromList = [];
        if (Array.isArray(r.from)) {
            fromList = r.from.map(s => String(s).trim()).filter(Boolean);
        } else if (typeof r.from === 'string') {
            fromList = r.from.split(/[,،]+/).map(s => s.trim()).filter(Boolean);
        }
        return {
            to: String(r.to || '').trim(),
            from: fromList,
            mode: r.mode === 'suggest' ? 'suggest' : 'auto'
        };
    }).filter(r => r.to && r.from.length > 0);
}

function loadRules() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            replacementRules = normalizeRules(JSON.parse(saved));
            if (!replacementRules.length) {
                replacementRules = JSON.parse(JSON.stringify(DEFAULT_RULES));
                saveRules();
            }
        } else {
            replacementRules = JSON.parse(JSON.stringify(DEFAULT_RULES));
            saveRules();
        }
    } catch (e) {
        replacementRules = JSON.parse(JSON.stringify(DEFAULT_RULES));
    }
    renderRulesList();
}

function saveRules() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(replacementRules));
    } catch (e) {}
    updateRulesBadge();
}

function updateRulesBadge() {
    if (rulesCountBadge) rulesCountBadge.textContent = replacementRules.length;
}

function renderRulesList() {
    if (!rulesListContainer) return;
    rulesListContainer.innerHTML = '';
    updateRulesBadge();

    if (!replacementRules.length) {
        rulesListContainer.innerHTML = '<div style="color:#71717a;font-size:12px;text-align:center;padding:12px;">No rules added yet. Add one above!</div>';
        return;
    }

    replacementRules.forEach((rule, ruleIdx) => {
        const row = document.createElement('div');
        row.className = 'rule-item';

        const wordsDiv = document.createElement('div');
        wordsDiv.className = 'rule-words';

        const fromList = Array.isArray(rule.from) ? rule.from : [rule.from];
        fromList.forEach((alias, aliasIdx) => {
            const pill = document.createElement('span');
            pill.className = 'rule-from-pill';
            pill.textContent = alias + ' ';

            const del = document.createElement('span');
            del.className = 'alias-del';
            del.textContent = '✕';
            del.title = 'Remove trigger';
            del.addEventListener('click', (e) => {
                e.stopPropagation();
                fromList.splice(aliasIdx, 1);
                if (!fromList.length) replacementRules.splice(ruleIdx, 1);
                saveRules();
                renderRulesList();
            });
            pill.appendChild(del);
            wordsDiv.appendChild(pill);
        });

        const arrow = document.createElement('span');
        arrow.className = 'rule-arrow';
        arrow.textContent = '➔';
        wordsDiv.appendChild(arrow);

        const to = document.createElement('span');
        to.className = 'rule-to';
        to.textContent = rule.to;
        wordsDiv.appendChild(to);

        const delBtn = document.createElement('button');
        delBtn.className = 'btn-del-rule';
        delBtn.textContent = '🗑';
        delBtn.title = 'Delete rule';
        delBtn.addEventListener('click', () => {
            replacementRules.splice(ruleIdx, 1);
            saveRules();
            renderRulesList();
        });

        row.appendChild(wordsDiv);
        row.appendChild(delBtn);
        rulesListContainer.appendChild(row);
    });
}

// Add new replacement rule
btnAddRule.addEventListener('click', () => {
    const fromVal = (inputFrom.value || '').trim();
    const toVal = (inputTo.value || '').trim();
    const modeVal = selectRuleMode.value || 'auto';

    if (!fromVal || !toVal) {
        showToast('Please enter spoken triggers and target word');
        return;
    }

    const aliases = fromVal.split(/[,،]+/).map(s => s.trim()).filter(Boolean);
    if (!aliases.length) return;

    replacementRules.unshift({ to: toVal, from: aliases, mode: modeVal });
    saveRules();
    renderRulesList();
    inputFrom.value = '';
    inputTo.value = '';
    showToast('Rule added');
});

// Modal open/close
btnOpenRules.addEventListener('click', () => modalOverlay.classList.add('open'));
btnCloseRules.addEventListener('click', () => modalOverlay.classList.remove('open'));
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('open');
});

// Export / Import Rules
btnExportRules.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(replacementRules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice_replacements_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Rules exported');
});

btnImportRules.addEventListener('click', () => fileImportRules.click());
fileImportRules.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const imported = JSON.parse(evt.target.result);
            const normalized = normalizeRules(imported);
            if (normalized.length) {
                replacementRules = normalized;
                saveRules();
                renderRulesList();
                showToast(`Imported ${normalized.length} rules`);
            }
        } catch (err) {
            showToast('Invalid JSON file');
        }
        fileImportRules.value = '';
    };
    reader.readAsText(file);
});

// --------------------------------------------------------------------------
// 4.1 Silence Timer Logic (1 Minute Inactivity Auto-Stop)
// --------------------------------------------------------------------------
function resetSilenceTimer() {
    lastSpeechTimestamp = Date.now();
    scheduleSilenceCheck();
}

function scheduleSilenceCheck() {
    if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
    }
    if (!isListening) return;

    const elapsed = Date.now() - lastSpeechTimestamp;
    const remaining = Math.max(0, SILENCE_TIMEOUT_MS - elapsed);

    silenceTimer = setTimeout(() => {
        if (!isListening) return;
        const currentElapsed = Date.now() - lastSpeechTimestamp;
        if (currentElapsed >= SILENCE_TIMEOUT_MS) {
            stopVoiceTyping();
            showToast('Microphone auto-stopped after 1 minute of silence');
            lblWriterStatus.textContent = 'Auto-stopped (1m silence)';
        } else {
            scheduleSilenceCheck();
        }
    }, remaining);
}

function clearSilenceTimer() {
    if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
    }
}

// --------------------------------------------------------------------------
// 4.2 Speech Recognition Engine
// --------------------------------------------------------------------------
function initSpeechRecognition() {
    if (!SpeechRecognition) {
        btnWriterMic.style.display = 'none';
        lblWriterStatus.textContent = 'Not Supported';
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectMicLang.value;

    recognition.onstart = () => {
        isListening = true;
        btnWriterMic.classList.add('listening');
        micLabel.textContent = 'Listening...';
        lblWriterStatus.textContent = `Listening (${selectMicLang.value})...`;
        lblWriterStatus.classList.add('listening');
        resetSilenceTimer();
    };

    recognition.onspeechstart = () => {
        resetSilenceTimer();
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        if (interimTranscript.trim() || finalTranscript.trim()) {
            resetSilenceTimer();
        }

        updateInterimPreview(interimTranscript);

        if (interimTranscript.trim() && punctuationTimer) {
            clearTimeout(punctuationTimer);
            punctuationTimer = null;
        }

        if (finalTranscript.trim()) {
            let clean = finalTranscript.trim().replace(/[.,!?;:।|\s]+$/, '').trim();
            if (clean) insertFinalText(clean);
        }
    };

    recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone permission in your browser address bar.');
            stopVoiceTyping();
        }
    };

    recognition.onend = () => {
        if (isListening) {
            try {
                recognition.start();
                scheduleSilenceCheck();
            } catch (e) {}
        } else {
            clearSilenceTimer();
            resetMicUI();
        }
    };
}

function startVoiceTyping() {
    if (!recognition) initSpeechRecognition();
    if (!recognition) return;

    resetSilenceTimer();
    try {
        recognition.lang = selectMicLang.value;
        recognition.start();
    } catch (e) {
        try {
            recognition.stop();
            setTimeout(() => {
                recognition.start();
                resetSilenceTimer();
            }, 200);
        } catch (err) {}
    }
}

function stopVoiceTyping() {
    isListening = false;
    clearSilenceTimer();
    finalizeSentencePunctuation();
    if (recognition) {
        try { recognition.stop(); } catch (e) {}
    }
    resetMicUI();
}

function resetMicUI() {
    isListening = false;
    btnWriterMic.classList.remove('listening');
    micLabel.textContent = 'Start';
    lblWriterStatus.textContent = 'Ready';
    lblWriterStatus.classList.remove('listening');
    updateInterimPreview('');
}

btnWriterMic.addEventListener('click', () => {
    if (isListening) stopVoiceTyping();
    else startVoiceTyping();
});

selectMicLang.addEventListener('change', () => {
    finalizeSentencePunctuation();
    if (isListening) {
        stopVoiceTyping();
        setTimeout(startVoiceTyping, 250);
    }
});

// --------------------------------------------------------------------------
// 4.3 Center Viewport Scrolling & Punctuation Helpers
// --------------------------------------------------------------------------
function scrollActiveTextToCenter() {
    if (!writerScrollContainer) return;

    if (interimSpan && writerEditor.contains(interimSpan)) {
        interimSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // Invisible anchor element at the end of text ensures 100% reliable centering
    let anchor = document.getElementById('caretScrollAnchor');
    if (!anchor) {
        anchor = document.createElement('span');
        anchor.id = 'caretScrollAnchor';
        anchor.style.cssText = 'display:inline-block;width:0;height:1px;visibility:hidden;pointer-events:none;';
    }
    writerEditor.appendChild(anchor);
    anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function getFullStopSymbol() {
    const lang = selectMicLang.value || 'hi-IN';
    return lang.startsWith('hi') ? '। ' : '. ';
}

function getEditorTrailingText() {
    let fullText = '';
    for (let i = 0; i < writerEditor.childNodes.length; i++) {
        const node = writerEditor.childNodes[i];
        if (node === interimSpan || node.id === 'caretScrollAnchor') continue;
        fullText += node.textContent || '';
    }
    return fullText;
}

function finalizeSentencePunctuation() {
    if (punctuationTimer) {
        clearTimeout(punctuationTimer);
        punctuationTimer = null;
    }

    for (let i = writerEditor.childNodes.length - 1; i >= 0; i--) {
        const node = writerEditor.childNodes[i];
        if (node === interimSpan || node.id === 'caretScrollAnchor') continue;
        if (node.nodeType === Node.TEXT_NODE) {
            const val = node.nodeValue || '';
            if (/[,\u060C]\s*$/.test(val)) {
                node.nodeValue = val.replace(/[,\u060C]\s*$/, getFullStopSymbol());
                updateWriterStats();
                break;
            }
        }
    }
}

function updateInterimPreview(text) {
    if (!interimSpan) {
        interimSpan = document.createElement('span');
        interimSpan.className = 'interim-preview';
    }

    if (text && text.trim()) {
        const trailingText = getEditorTrailingText();
        const needsSpace = trailingText.length > 0 && !/\s$/.test(trailingText);
        interimSpan.textContent = (needsSpace ? ' ' : '') + text.trim();
        if (!writerEditor.contains(interimSpan)) {
            writerEditor.appendChild(interimSpan);
        }
        interimSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        if (writerEditor.contains(interimSpan)) {
            writerEditor.removeChild(interimSpan);
        }
    }
}

function parseReplacementSegments(text, rules) {
    if (!rules || !rules.length) return [{ type: 'text', text }];
    const patterns = [];
    rules.forEach(rule => {
        const fromList = Array.isArray(rule.from) ? rule.from : [rule.from];
        fromList.forEach(alias => {
            const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            patterns.push({ regex: new RegExp('(^|\\s)(' + escaped + ')(?=[\\s.,!?;:।|\\u060C]|$)', 'gi'), rule });
        });
    });

    let segments = [{ type: 'text', text }];
    patterns.forEach(({ regex, rule }) => {
        const next = [];
        segments.forEach(seg => {
            if (seg.type !== 'text') {
                next.push(seg);
                return;
            }
            let lastIdx = 0;
            let match;
            regex.lastIndex = 0;
            while ((match = regex.exec(seg.text)) !== null) {
                const leadSpace = match[1] || '';
                const matchedWord = match[2];
                const matchStart = match.index + leadSpace.length;
                if (matchStart > lastIdx) {
                    next.push({ type: 'text', text: seg.text.slice(lastIdx, matchStart) });
                }
                next.push({ type: 'replaced', original: matchedWord, target: rule.to, mode: rule.mode });
                lastIdx = match.index + match[0].length;
            }
            if (lastIdx < seg.text.length) {
                next.push({ type: 'text', text: seg.text.slice(lastIdx) });
            }
        });
        segments = next;
    });
    return segments;
}

function createReplacedWordSpan(original, target, mode) {
    const span = document.createElement('span');
    span.className = `replaced-word mode-${mode}`;
    span.textContent = mode === 'suggest' ? original : target;
    span.setAttribute('data-original', original);
    span.setAttribute('data-target', target);
    span.title = mode === 'suggest' ? `Click to apply "${target}"` : `Click to revert to "${original}"`;

    span.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mode === 'suggest') {
            span.textContent = target;
            span.className = 'replaced-word mode-auto';
        } else {
            const isReverted = span.classList.toggle('reverted');
            span.textContent = isReverted ? original : target;
        }
    });
    return span;
}

function insertFinalText(rawText) {
    hideFloatingMenu();
    if (punctuationTimer) {
        clearTimeout(punctuationTimer);
        punctuationTimer = null;
    }

    if (writerEditor.contains(interimSpan)) {
        writerEditor.removeChild(interimSpan);
    }

    const trailingText = getEditorTrailingText();
    const needsLeadingSpace = trailingText.length > 0 && !/\s$/.test(trailingText);
    const prefix = needsLeadingSpace ? ' ' : '';

    const segments = parseReplacementSegments(rawText, replacementRules);
    const fragment = document.createDocumentFragment();

    if (prefix) fragment.appendChild(document.createTextNode(prefix));

    segments.forEach(seg => {
        if (seg.type === 'text') fragment.appendChild(document.createTextNode(seg.text));
        else if (seg.type === 'replaced') fragment.appendChild(createReplacedWordSpan(seg.original, seg.target, seg.mode));
    });

    fragment.appendChild(document.createTextNode(', '));
    writerEditor.appendChild(fragment);

    scrollActiveTextToCenter();
    updateWriterStats();

    punctuationTimer = setTimeout(() => {
        finalizeSentencePunctuation();
    }, PAUSE_DURATION_MS);
}

// --------------------------------------------------------------------------
// 4.4 Writer Statistics & Input Centering
// --------------------------------------------------------------------------
function updateWriterStats() {
    const rawText = writerEditor.innerText || '';
    const trimmed = rawText.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const chars = rawText.length;

    lblWordCount.textContent = `${words} word${words === 1 ? '' : 's'}`;
    lblCharCount.textContent = `${chars} character${chars === 1 ? '' : 's'}`;
}

function keepCaretCenteredOnTyping() {
    try {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        let rect = range.getBoundingClientRect();
        if ((!rect || (rect.top === 0 && rect.bottom === 0)) && range.startContainer) {
            const el = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
            if (el && writerEditor.contains(el)) rect = el.getBoundingClientRect();
        }
        if (rect && rect.top > window.innerHeight * 0.55) {
            scrollActiveTextToCenter();
        }
    } catch (e) {}
}

writerEditor.addEventListener('input', () => {
    updateWriterStats();
    keepCaretCenteredOnTyping();
});

writerEditor.addEventListener('keyup', (e) => {
    if (['Enter', 'ArrowDown', 'PageDown'].includes(e.key)) {
        keepCaretCenteredOnTyping();
    }
});

// --------------------------------------------------------------------------
// 4.5 Writer Actions (Copy, Save, Double-Click Clear)
// --------------------------------------------------------------------------
btnWriterCopy.addEventListener('click', async () => {
    finalizeSentencePunctuation();
    const text = writerEditor.innerText || '';
    if (!text.trim()) {
        showToast('Nothing to copy');
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard');
    } catch (e) {
        showToast('Copy failed');
    }
});

btnWriterDownload.addEventListener('click', () => {
    finalizeSentencePunctuation();
    const text = writerEditor.innerText || '';
    if (!text.trim()) {
        showToast('Nothing to save');
        return;
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice_notes_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Saved file');
});

// Clear Button Double-Click Protection
function resetWriterClearButton() {
    if (clearConfirmTimeout) {
        clearTimeout(clearConfirmTimeout);
        clearConfirmTimeout = null;
    }
    btnWriterClear.classList.remove('confirm-state');
    btnWriterClear.innerHTML = '🧹 Clear';
}

function executeWriterClear() {
    resetWriterClearButton();
    hideFloatingMenu();
    if (punctuationTimer) {
        clearTimeout(punctuationTimer);
        punctuationTimer = null;
    }
    if (isListening) stopVoiceTyping();
    writerEditor.innerHTML = '';
    updateWriterStats();
    writerEditor.focus();
    showToast('Workspace cleared');
}

btnWriterClear.addEventListener('click', () => {
    const text = writerEditor.innerText || '';
    if (!text.trim()) {
        resetWriterClearButton();
        showToast('Workspace is already empty');
        return;
    }

    if (btnWriterClear.classList.contains('confirm-state')) {
        executeWriterClear();
    } else {
        btnWriterClear.classList.add('confirm-state');
        btnWriterClear.innerHTML = '⚠️ Click again';
        showToast('Double-click or click again to confirm clear');

        clearConfirmTimeout = setTimeout(() => {
            resetWriterClearButton();
        }, 2500);
    }
});

btnWriterClear.addEventListener('dblclick', (e) => {
    e.preventDefault();
    if ((writerEditor.innerText || '').trim()) executeWriterClear();
});

// Contextual Quick Selection Menu (Writer)
function hideFloatingMenu() {
    if (!floatingMenu) return;
    floatingMenu.classList.remove('visible');
}

writerEditor.addEventListener('mouseup', () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
        hideFloatingMenu();
        return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
        floatingMenu.style.top = `${Math.max(60, rect.top - 42)}px`;
        floatingMenu.style.left = `${Math.max(20, rect.left + rect.width / 2 - 60)}px`;
        floatingMenu.classList.add('visible');
    }
});

btnFloatCopy.addEventListener('click', async () => {
    const selText = window.getSelection().toString();
    if (selText) {
        await navigator.clipboard.writeText(selText);
        showToast('Selection copied');
        hideFloatingMenu();
    }
});

btnFloatPaste.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            document.execCommand('insertText', false, text);
            updateWriterStats();
            hideFloatingMenu();
        }
    } catch (e) {}
});

btnFloatDelete.addEventListener('click', () => {
    document.execCommand('delete');
    updateWriterStats();
    hideFloatingMenu();
});

document.addEventListener('mousedown', (e) => {
    if (floatingMenu && !floatingMenu.contains(e.target) && !writerEditor.contains(e.target)) {
        hideFloatingMenu();
    }
    if (btnWriterClear && !btnWriterClear.contains(e.target)) {
        resetWriterClearButton();
    }
});

// --------------------------------------------------------------------------
// 5. READER (TTS Workspace Engine)
// --------------------------------------------------------------------------
let readerSentences = [];
let readerCurrentIndex = -1;
let isReaderPlaying = false;
let currentSpeed = 1.45;
let readerSessionId = 0;
let hindiVoice = null;
let isCleanMode = true;
let rawOriginalText = '';
let cleanedText = '';

let isAutoScrollEnabled = true;
let isProgrammaticScrolling = false;

let totalDurationSeconds = 0;
let currentElapsedSeconds = 0;
let sentenceStartTimestamp = 0;
let playbackTimer = null;
const WORDS_PER_MINUTE_BASE = 130;

function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    hindiVoice = voices.find(v => v.name.includes('Google') && (v.lang.includes('hi') || v.name.includes('हिन्दी') || v.name.includes('Hindi'))) ||
                 voices.find(v => v.lang.startsWith('hi')) ||
                 voices.find(v => v.name.includes('Hindi')) ||
                 null;
}

if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
}

// --------------------------------------------------------------------------
// 5.1 Intelligent Text & Junk Symbol Sanitizer (Auto-Clean)
// --------------------------------------------------------------------------
function cleanTextForTTS(rawText) {
    if (!rawText) return '';
    let s = String(rawText);

    // 1. Zero-width spaces & non-printable control characters
    s = s.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ');

    // 2. Markdown Links: [Title](url) -> Title
    s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // 3. Raw URLs
    s = s.replace(/https?:\/\/\S+/gi, '');

    // 4. Code fences & backticks
    s = s.replace(/```[\s\S]*?```/g, (match) => {
        return match.replace(/```[a-z0-9_-]*/gi, '').replace(/```/g, '');
    });
    s = s.replace(/`+/g, '');

    // 5. Markdown Headings (#, ##, ###)
    s = s.replace(/(^|\n)\s*#+\s*/g, '$1');
    s = s.replace(/(^|\s)#+(?=\s|$)/g, '$1');

    // 6. Blockquotes
    s = s.replace(/(^|\n)\s*>+\s*/g, '$1');

    // 7. Dividers
    s = s.replace(/(^|\n)\s*[-=*_]{3,}\s*($|\n)/g, '$1\n');

    // 8. Bold / Italic / Strikethrough
    s = s.replace(/\*{1,3}([^*\n]+)\*{1,3}/g, '$1');
    s = s.replace(/_{1,3}([^_\n]+)_{1,3}/g, '$1');
    s = s.replace(/~{1,2}([^~\n]+)~{1,2}/g, '$1');

    // 9. Junk / Decorative Symbols: ##***°`><]}}€£, bullets, arrows, degree, etc.
    s = s.replace(/[#*°`><\[\]{}€£¥•●○■□▪▫◆◇★☆✦✧➔➜→←⇒►▶➤▲▼※§¶^|\\~_]/g, ' ');

    // 10. Repeated punctuation noise
    s = s.replace(/([.।!?]){2,}/g, '$1');
    s = s.replace(/,{2,}/g, ',');
    s = s.replace(/[-]{2,}/g, ' ');

    // 11. Normalize spaces around valid punctuation
    s = s.replace(/\s+([,।!?;:])/g, '$1');
    s = s.replace(/([,।!?;:])(?!\s|$)/g, '$1 ');

    // 12. Normalize whitespace
    s = s.replace(/[ \t]+/g, ' ');
    s = s.replace(/(^|\n)[ \t]+/g, '$1');
    s = s.replace(/[ \t]+($|\n)/g, '$1');
    s = s.replace(/\n\s*\n\s*\n+/g, '\n\n');

    return s.trim();
}

function updateCleanToggleUI() {
    if (!btnReaderToggleClean) return;
    if (isCleanMode) {
        btnReaderToggleClean.classList.add('active');
        cleanIcon.textContent = '🧹';
        cleanLabel.textContent = 'Clean Text';
        btnReaderToggleClean.title = 'Clean mode active (Click to view Original text)';
    } else {
        btnReaderToggleClean.classList.remove('active');
        cleanIcon.textContent = '📄';
        cleanLabel.textContent = 'Original';
        btnReaderToggleClean.title = 'Original mode active (Click to view Clean text)';
    }
}

function toggleCleanMode() {
    isCleanMode = !isCleanMode;
    updateCleanToggleUI();

    if (rawOriginalText) {
        const activeText = isCleanMode ? (cleanedText || cleanTextForTTS(rawOriginalText)) : rawOriginalText;
        const bundles = processTextInto20WordBundles(activeText, 20);
        if (!bundles.length) return;

        const currentRatio = (readerSentences.length > 0 && readerCurrentIndex >= 0) ? (readerCurrentIndex / readerSentences.length) : 0;
        const wasPlaying = isReaderPlaying;

        if (wasPlaying) {
            window.speechSynthesis.cancel();
            isReaderPlaying = false;
            stopReaderTimer();
        }

        renderReaderSentences(bundles);

        const targetIndex = Math.min(readerSentences.length - 1, Math.max(0, Math.round(currentRatio * (readerSentences.length - 1))));
        readerCurrentIndex = targetIndex;

        if (wasPlaying) playReaderSentence(targetIndex);
        else {
            highlightReaderSentence(targetIndex);
            updateReaderProgress();
        }
    }
}

btnReaderToggleClean.addEventListener('click', toggleCleanMode);

// --------------------------------------------------------------------------
// 5.2 20-Word Sentence Bundling Logic
// --------------------------------------------------------------------------
function countWords(str) {
    return str.trim().split(/\s+/).filter(Boolean).length;
}

function processTextInto20WordBundles(text, minWords = 20) {
    text = text.trim();
    if (!text) return [];

    let s = text.replace(/(\d+)\.(\d+)/g, '$1___DEC___$2');
    s = s.replace(/\b(Mr|Mrs|Dr|Prof|vs|etc)\./gi, '$1___DOT___');

    const rawParts = s.split(/([।!?…]+|\.(?!\S)|\r?\n+)/);
    const rawUnits = [];

    for (let i = 0; i < rawParts.length; i += 2) {
        const chunk = (rawParts[i] || '').trim();
        const punct = (rawParts[i + 1] || '').trim();
        if (chunk) rawUnits.push({ text: chunk, punct: punct });
        else if (punct && rawUnits.length) rawUnits[rawUnits.length - 1].punct += punct;
    }

    const bundles = [];
    let currentUnits = [];
    let currentWordCount = 0;
    let bundleId = 0;

    for (let i = 0; i < rawUnits.length; i++) {
        const u = rawUnits[i];
        const wCount = countWords(u.text);
        currentUnits.push(u);
        currentWordCount += wCount;

        if (currentWordCount >= minWords) {
            const bundledText = buildBundle(currentUnits);
            if (bundledText) bundles.push({ id: bundleId++, text: bundledText });
            currentUnits = [];
            currentWordCount = 0;
        }
    }

    if (currentUnits.length > 0) {
        const bundledText = buildBundle(currentUnits);
        if (bundledText) bundles.push({ id: bundleId++, text: bundledText });
    }

    return bundles;
}

function buildBundle(units) {
    if (!units.length) return '';
    let result = '';
    for (let i = 0; i < units.length; i++) {
        const u = units[i];
        const clean = u.text.replace(/___DEC___/g, '.').replace(/___DOT___/g, '.');
        const isLast = (i === units.length - 1);
        if (isLast) {
            let endPunct = u.punct.replace(/\r?\n+/g, '').replace(/___DEC___/g, '.');
            if (!endPunct || endPunct === ',') endPunct = '।';
            result += clean + endPunct;
        } else {
            if (clean.endsWith(',')) result += clean + ' ';
            else result += clean + ', ';
        }
    }
    return result.trim();
}

// --------------------------------------------------------------------------
// 5.3 Reader Rendering & Playback
// --------------------------------------------------------------------------
function formatTime(totalSec) {
    const s = Math.floor(Math.max(0, totalSec));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function calculateSentenceTimings() {
    let accumTime = 0;
    readerSentences.forEach(s => {
        const words = countWords(s.text);
        const dur = (words / WORDS_PER_MINUTE_BASE) * 60 / currentSpeed;
        s.startTime = accumTime;
        s.duration = dur;
        accumTime += dur;
    });
    totalDurationSeconds = accumTime;
    updateReaderTimeDisplay();
}

function updateReaderTimeDisplay() {
    if (!readerSentences.length || totalDurationSeconds <= 0) {
        lblTime.textContent = "00:00 / 00:00";
        return;
    }
    lblTime.textContent = `${formatTime(currentElapsedSeconds)} / ${formatTime(totalDurationSeconds)}`;
}

function startReaderTimer() {
    stopReaderTimer();
    playbackTimer = setInterval(() => {
        if (!isReaderPlaying || readerCurrentIndex < 0 || readerCurrentIndex >= readerSentences.length) return;
        const cur = readerSentences[readerCurrentIndex];
        const elapsedInSentence = (Date.now() - sentenceStartTimestamp) / 1000;
        currentElapsedSeconds = Math.min(totalDurationSeconds, cur.startTime + Math.min(elapsedInSentence, cur.duration));
        updateReaderTimeDisplay();
        if (totalDurationSeconds > 0) {
            trackFill.style.width = `${Math.min(100, (currentElapsedSeconds / totalDurationSeconds) * 100)}%`;
        }
    }, 200);
}

function stopReaderTimer() {
    if (playbackTimer) {
        clearInterval(playbackTimer);
        playbackTimer = null;
    }
}

function renderReaderSentences(bundleList) {
    readerEditor.innerHTML = '';
    readerSentences = [];

    bundleList.forEach((b) => {
        const div = document.createElement('div');
        div.className = 'tts-sentence';
        div.id = `reader-b-${b.id}`;
        div.textContent = b.text;
        div.title = 'Double-click to start speaking from here';

        div.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            jumpAndPlayReader(b.id);
        });

        readerEditor.appendChild(div);
        readerSentences.push({
            id: b.id,
            text: b.text,
            element: div,
            startTime: 0,
            duration: 0
        });
    });

    calculateSentenceTimings();
}

function highlightReaderSentence(idx) {
    readerSentences.forEach((s, i) => {
        if (i === idx) {
            s.element.classList.add('active');
            s.element.classList.remove('played');
            smartScrollToReaderElement(s.element);
        } else if (i < idx) {
            s.element.classList.remove('active');
            s.element.classList.add('played');
        } else {
            s.element.classList.remove('active', 'played');
        }
    });
}

function updateReaderProgress() {
    if (!readerSentences.length) {
        lblCounter.textContent = "Line 0 / 0";
        trackFill.style.width = "0%";
        updateReaderTimeDisplay();
        return;
    }
    const cur = Math.max(1, readerCurrentIndex + 1);
    lblCounter.textContent = `Line ${cur} / ${readerSentences.length}`;
    updateReaderTimeDisplay();
}

function isReaderElementVisible(el, container) {
    const elRect = el.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    return (elRect.top >= contRect.top + 60 && elRect.bottom <= contRect.bottom - 70);
}

function smartScrollToReaderElement(el) {
    if (!el || !isAutoScrollEnabled) return;
    if (isReaderElementVisible(el, readerScrollContainer)) return;

    isProgrammaticScrolling = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { isProgrammaticScrolling = false; }, 600);
}

function handleUserManualScroll() {
    if (isProgrammaticScrolling) return;
    if (isAutoScrollEnabled) {
        isAutoScrollEnabled = false;
        readerScrollResumePill.classList.add('show');
    }
}

readerScrollContainer.addEventListener('wheel', handleUserManualScroll, { passive: true });
readerScrollContainer.addEventListener('touchmove', handleUserManualScroll, { passive: true });

readerScrollResumePill.addEventListener('click', () => {
    isAutoScrollEnabled = true;
    readerScrollResumePill.classList.remove('show');
    if (readerCurrentIndex >= 0 && readerSentences[readerCurrentIndex]) {
        readerSentences[readerCurrentIndex].element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});

function playReaderSentence(idx) {
    if (idx < 0 || idx >= readerSentences.length) {
        finishReaderPlayback();
        return;
    }

    window.speechSynthesis.cancel();
    readerCurrentIndex = idx;
    const currentSession = ++readerSessionId;
    isReaderPlaying = true;
    btnPlayPause.textContent = '⏸';
    lblReaderStatus.textContent = "Playing";
    highlightReaderSentence(idx);

    const cur = readerSentences[idx];
    currentElapsedSeconds = cur.startTime;
    sentenceStartTimestamp = Date.now();
    updateReaderProgress();
    startReaderTimer();

    const utter = new SpeechSynthesisUtterance(cur.text);
    if (!hindiVoice) loadVoices();
    if (hindiVoice) utter.voice = hindiVoice;
    utter.rate = currentSpeed;

    utter.onend = () => {
        if (currentSession === readerSessionId && isReaderPlaying) {
            const nextIdx = readerCurrentIndex + 1;
            if (nextIdx < readerSentences.length) playReaderSentence(nextIdx);
            else finishReaderPlayback();
        }
    };

    utter.onerror = () => {
        if (currentSession === readerSessionId && isReaderPlaying) {
            const nextIdx = readerCurrentIndex + 1;
            if (nextIdx < readerSentences.length) playReaderSentence(nextIdx);
            else finishReaderPlayback();
        }
    };

    window.speechSynthesis.speak(utter);
}

function finishReaderPlayback() {
    isReaderPlaying = false;
    stopReaderTimer();
    btnPlayPause.textContent = '▶';
    window.speechSynthesis.cancel();
    lblReaderStatus.textContent = "Finished";
    readerSentences.forEach(s => {
        s.element.classList.remove('active');
        s.element.classList.add('played');
    });
    currentElapsedSeconds = totalDurationSeconds;
    updateReaderTimeDisplay();
    trackFill.style.width = "100%";
    if (readerSentences.length) {
        lblCounter.textContent = `Line ${readerSentences.length} / ${readerSentences.length}`;
    }
}

function jumpAndPlayReader(idx) {
    if (idx < 0 || idx >= readerSentences.length) return;
    isAutoScrollEnabled = true;
    readerScrollResumePill.classList.remove('show');
    window.speechSynthesis.cancel();
    playReaderSentence(idx);
}

function toggleReaderPlayPause() {
    if (!readerSentences.length) return;
    if (isReaderPlaying) {
        window.speechSynthesis.cancel();
        isReaderPlaying = false;
        stopReaderTimer();
        btnPlayPause.textContent = '▶';
        lblReaderStatus.textContent = "Paused";
    } else {
        if (readerCurrentIndex === -1) readerCurrentIndex = 0;
        playReaderSentence(readerCurrentIndex);
    }
}

function stopReaderPlayback() {
    isReaderPlaying = false;
    stopReaderTimer();
    btnPlayPause.textContent = '▶';
    window.speechSynthesis.cancel();
    lblReaderStatus.textContent = "Ready";
    currentElapsedSeconds = 0;
    updateReaderTimeDisplay();
    trackFill.style.width = "0%";
    readerSentences.forEach(s => s.element.classList.remove('active'));
}

function handleReaderPastedText(rawText) {
    if (!rawText || !rawText.trim()) return;

    stopReaderPlayback();
    rawOriginalText = rawText.trim();
    cleanedText = cleanTextForTTS(rawOriginalText);

    const activeText = isCleanMode ? (cleanedText || rawOriginalText) : rawOriginalText;
    const bundles = processTextInto20WordBundles(activeText, 20);
    if (!bundles.length) return;

    isAutoScrollEnabled = true;
    readerScrollResumePill.classList.remove('show');

    renderReaderSentences(bundles);
    readerCurrentIndex = 0;
    updateReaderProgress();

    playReaderSentence(0);
}

// Speed slider
speedSlider.addEventListener('input', (e) => {
    currentSpeed = parseFloat(e.target.value);
    speedValue.textContent = currentSpeed.toFixed(2) + 'x';
    if (readerSentences.length > 0) calculateSentenceTimings();
    if (isReaderPlaying && readerCurrentIndex >= 0) playReaderSentence(readerCurrentIndex);
});

// Controls
btnPlayPause.addEventListener('click', toggleReaderPlayPause);
btnPrev.addEventListener('click', () => { if (readerCurrentIndex > 0) jumpAndPlayReader(readerCurrentIndex - 1); });
btnNext.addEventListener('click', () => { if (readerCurrentIndex < readerSentences.length - 1) jumpAndPlayReader(readerCurrentIndex + 1); });

btnReaderClear.addEventListener('click', () => {
    stopReaderPlayback();
    readerEditor.innerHTML = '';
    readerSentences = [];
    rawOriginalText = '';
    cleanedText = '';
    readerCurrentIndex = -1;
    totalDurationSeconds = 0;
    currentElapsedSeconds = 0;
    updateReaderProgress();
    lblCounter.textContent = "Line 0 / 0";
    lblTime.textContent = "00:00 / 00:00";
    lblReaderStatus.textContent = "Ready";
    readerScrollResumePill.classList.remove('show');
    readerEditor.focus();
});

trackBar.addEventListener('click', (e) => {
    if (!readerSentences.length || totalDurationSeconds <= 0) return;
    const rect = trackBar.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetSeconds = fraction * totalDurationSeconds;

    let targetIdx = 0;
    for (let i = 0; i < readerSentences.length; i++) {
        if (targetSeconds >= readerSentences[i].startTime) targetIdx = i;
        else break;
    }
    jumpAndPlayReader(targetIdx);
});

btnReaderPaste.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) handleReaderPastedText(text);
    } catch (err) {
        const manual = prompt("Paste your text here:");
        if (manual) handleReaderPastedText(manual);
    }
});

readerEditor.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (text && text.trim()) handleReaderPastedText(text);
});

// --------------------------------------------------------------------------
// 6. Global Keyboard Shortcuts
// --------------------------------------------------------------------------
document.addEventListener('keydown', (e) => {
    // Esc closes modal
    if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
        modalOverlay.classList.remove('open');
        return;
    }

    // Ctrl + Enter (or Cmd + Enter): Send to Reader!
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        sendWriterTextToReader();
        return;
    }

    // Alt + V or F8: Toggle Voice Typing
    if ((e.altKey && e.code === 'KeyV') || e.code === 'F8') {
        e.preventDefault();
        btnWriterMic.click();
        return;
    }

    // Space: Reader Play/Pause (when not actively typing in editor)
    if (e.code === 'Space' && (readerSentences.length > 0 && document.activeElement !== writerEditor && document.activeElement !== readerEditor)) {
        e.preventDefault();
        toggleReaderPlayPause();
    } else if (e.code === 'ArrowLeft' && (document.activeElement !== writerEditor && document.activeElement !== readerEditor)) {
        e.preventDefault();
        if (readerCurrentIndex > 0) jumpAndPlayReader(readerCurrentIndex - 1);
    } else if (e.code === 'ArrowRight' && (document.activeElement !== writerEditor && document.activeElement !== readerEditor)) {
        e.preventDefault();
        if (readerCurrentIndex < readerSentences.length - 1) jumpAndPlayReader(readerCurrentIndex + 1);
    }
});

// --------------------------------------------------------------------------
// 7. Initial Boot & State Hydration
// --------------------------------------------------------------------------
loadRules();
loadSavedLayout();
initSpeechRecognition();
updateWriterStats();
