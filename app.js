// ==========================================================================
// Voice Typing Studio — Core Application Logic
// Dedicated Speech-to-Text & Smart Auto-Replacement Dictionary
// ==========================================================================

// DOM Elements
const editor = document.getElementById('editor');
const btnMic = document.getElementById('btnMic');
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
const btnCopy = document.getElementById('btnCopy');
const btnDownload = document.getElementById('btnDownload');
const btnClear = document.getElementById('btnClear');
const lblWordCount = document.getElementById('lblWordCount');
const lblCharCount = document.getElementById('lblCharCount');
const lblStatus = document.getElementById('lblStatus');
const toastMessage = document.getElementById('toastMessage');
const scrollContainer = document.getElementById('scrollContainer');
const floatingMenu = document.getElementById('floatingMenu');
const btnFloatCopy = document.getElementById('btnFloatCopy');
const btnFloatPaste = document.getElementById('btnFloatPaste');
const btnFloatDelete = document.getElementById('btnFloatDelete');

// State Variables
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;
let interimSpan = null;
let punctuationTimer = null;
let pendingDeleteCallback = null;
let savedSelectionRange = null;
const PAUSE_DURATION_MS = 4000; // 4 seconds silence countdown before comma converts to full stop

// Auto-Replace Dictionary Key & Starter Multi-Alias Rules
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

// --------------------------------------------------------------------------
// 1. Auto-Replace Dictionary Logic (Multi-Alias Support)
// --------------------------------------------------------------------------
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

// Confirmation Dialog Logic (Prevents Accidental Deletions)
function showConfirmDialog({ title, desc, onConfirm }) {
    if (!confirmOverlay) return;
    confirmTitle.textContent = title;
    confirmDesc.textContent = desc;
    pendingDeleteCallback = onConfirm;
    confirmOverlay.classList.add('open');
}

function hideConfirmDialog() {
    if (!confirmOverlay) return;
    confirmOverlay.classList.remove('open');
    pendingDeleteCallback = null;
}

btnConfirmCancel.addEventListener('click', hideConfirmDialog);
btnConfirmDelete.addEventListener('click', () => {
    if (typeof pendingDeleteCallback === 'function') {
        pendingDeleteCallback();
    }
    hideConfirmDialog();
});
confirmOverlay.addEventListener('click', (e) => {
    if (e.target === confirmOverlay) {
        hideConfirmDialog();
    }
});

function loadRules() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            replacementRules = normalizeRules(parsed);
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
    rulesCountBadge.textContent = replacementRules.length;
}

function renderRulesList() {
    rulesListContainer.innerHTML = '';
    updateRulesBadge();

    if (!replacementRules.length) {
        rulesListContainer.innerHTML = '<div class="empty-rules">No rules added yet. Add one above!</div>';
        return;
    }

    replacementRules.forEach((rule, ruleIdx) => {
        const row = document.createElement('div');
        row.className = 'rule-item';

        const wordsDiv = document.createElement('div');
        wordsDiv.className = 'rule-words';

        // Container for multiple trigger alias pills
        const aliasesContainer = document.createElement('div');
        aliasesContainer.className = 'rule-from-tags';

        const fromList = Array.isArray(rule.from) ? rule.from : [rule.from];
        fromList.forEach((alias, aliasIdx) => {
            const pill = document.createElement('span');
            pill.className = 'rule-from-pill';
            pill.textContent = alias;

            const delAliasBtn = document.createElement('span');
            delAliasBtn.className = 'alias-del';
            delAliasBtn.textContent = '✕';
            delAliasBtn.title = 'Remove';
            delAliasBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                requestDeleteAlias(ruleIdx, aliasIdx);
            });

            pill.appendChild(delAliasBtn);
            aliasesContainer.appendChild(pill);
        });

        const arrowSpan = document.createElement('span');
        arrowSpan.className = 'rule-arrow';
        arrowSpan.textContent = '➔';

        const toSpan = document.createElement('span');
        toSpan.className = 'rule-to';
        toSpan.textContent = rule.to;

        wordsDiv.appendChild(aliasesContainer);
        wordsDiv.appendChild(arrowSpan);
        wordsDiv.appendChild(toSpan);

        // Right-side actions: Mode Pill & Delete Button
        const rightDiv = document.createElement('div');
        rightDiv.className = 'rule-right-actions';

        const modePill = document.createElement('span');
        modePill.className = `rule-mode-pill ${rule.mode || 'auto'}`;
        modePill.textContent = rule.mode === 'suggest' ? '💡 Suggest' : '⚡ Auto';
        modePill.title = 'Click to toggle mode';
        modePill.addEventListener('click', () => {
            toggleRuleMode(ruleIdx);
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'rule-del-btn';
        delBtn.textContent = '🗑';
        delBtn.title = 'Delete';
        delBtn.addEventListener('click', () => {
            requestDeleteRule(ruleIdx);
        });

        rightDiv.appendChild(modePill);
        rightDiv.appendChild(delBtn);

        row.appendChild(wordsDiv);
        row.appendChild(rightDiv);
        rulesListContainer.appendChild(row);
    });
}

function addRule(fromInput, toInput, mode = 'auto') {
    fromInput = fromInput.trim();
    toInput = toInput.trim();
    if (!fromInput || !toInput) return;

    // Split multiple aliases by comma, arabic comma, or newline
    const newAliases = fromInput.split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
    if (!newAliases.length) return;

    // Check if a rule for this target word already exists (case-insensitive)
    const existing = replacementRules.find(r => r.to.toLowerCase() === toInput.toLowerCase());
    if (existing) {
        newAliases.forEach(alias => {
            if (!existing.from.some(a => a.toLowerCase() === alias.toLowerCase())) {
                existing.from.push(alias);
            }
        });
        existing.mode = mode;
    } else {
        replacementRules.unshift({
            to: toInput,
            from: newAliases,
            mode: mode
        });
    }

    saveRules();
    renderRulesList();
}

function requestDeleteAlias(ruleIdx, aliasIdx) {
    if (ruleIdx >= 0 && ruleIdx < replacementRules.length) {
        const rule = replacementRules[ruleIdx];
        const alias = rule.from[aliasIdx];
        showConfirmDialog({
            title: `Remove "${alias}"?`,
            desc: `It will no longer trigger "${rule.to}".`,
            onConfirm: () => {
                rule.from.splice(aliasIdx, 1);
                if (rule.from.length === 0) {
                    replacementRules.splice(ruleIdx, 1);
                }
                saveRules();
                renderRulesList();
                showToast(`Removed "${alias}"`);
            }
        });
    }
}

function requestDeleteRule(idx) {
    if (idx >= 0 && idx < replacementRules.length) {
        const rule = replacementRules[idx];
        showConfirmDialog({
            title: `Delete "${rule.to}"?`,
            desc: `All trigger words (${rule.from.join(', ')}) will be permanently removed.`,
            onConfirm: () => {
                replacementRules.splice(idx, 1);
                saveRules();
                renderRulesList();
                showToast('Rule deleted');
            }
        });
    }
}

function toggleRuleMode(ruleIdx) {
    if (ruleIdx >= 0 && ruleIdx < replacementRules.length) {
        const current = replacementRules[ruleIdx].mode || 'auto';
        replacementRules[ruleIdx].mode = current === 'auto' ? 'suggest' : 'auto';
        saveRules();
        renderRulesList();
        showToast(replacementRules[ruleIdx].mode === 'suggest' ? 'Mode: Suggest' : 'Mode: Auto');
    }
}

// Tokenizes utterance text into regular text and replaced/suggested words
function parseReplacementSegments(text, rules) {
    if (!text || !rules || !rules.length) {
        return [{ type: 'text', text }];
    }

    // Flatten all aliases with their target word and mode
    const entries = [];
    rules.forEach(rule => {
        const target = rule.to ? rule.to.trim() : '';
        if (!target) return;
        const fromList = Array.isArray(rule.from) ? rule.from : [rule.from];
        const mode = rule.mode || 'auto';
        fromList.forEach(alias => {
            if (alias && alias.trim()) {
                entries.push({
                    alias: alias.trim(),
                    to: target,
                    mode: mode
                });
            }
        });
    });

    if (!entries.length) {
        return [{ type: 'text', text }];
    }

    // Sort by alias length descending so longer phrases match first
    entries.sort((a, b) => b.alias.length - a.alias.length);

    const escapedAliases = entries.map(e => e.alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const combinedPattern = new RegExp('(' + escapedAliases.join('|') + ')', 'gi');

    const segments = [];
    let lastIndex = 0;
    let match;

    while ((match = combinedPattern.exec(text)) !== null) {
        const matchedStr = match[0];
        const matchStart = match.index;
        const matchEnd = combinedPattern.lastIndex;

        if (matchStart > lastIndex) {
            segments.push({
                type: 'text',
                text: text.substring(lastIndex, matchStart)
            });
        }

        const matchedLower = matchedStr.toLowerCase();
        const matchedEntry = entries.find(e => e.alias.toLowerCase() === matchedLower);
        const targetWord = matchedEntry ? matchedEntry.to : matchedStr;
        const ruleMode = matchedEntry ? matchedEntry.mode : 'auto';

        segments.push({
            type: 'replaced',
            original: matchedStr,
            target: targetWord,
            mode: ruleMode
        });

        lastIndex = matchEnd;
    }

    if (lastIndex < text.length) {
        segments.push({
            type: 'text',
            text: text.substring(lastIndex)
        });
    }

    return segments;
}

// Creates interactive replaced/suggested-word span with hover tooltip and click-to-toggle
function createReplacedWordSpan(originalWord, targetWord, mode = 'auto') {
    const span = document.createElement('span');
    span.setAttribute('contenteditable', 'false');
    span.dataset.original = originalWord;
    span.dataset.replaced = targetWord;
    span.dataset.mode = mode;

    if (mode === 'suggest') {
        // Suggestion mode: keeps original spoken word initially, styled in violet
        span.className = 'replaced-word mode-suggest';
        span.textContent = originalWord;
    } else {
        // Auto-replace mode: replaced immediately with target word, styled in cyan
        span.className = 'replaced-word';
        span.textContent = targetWord;
    }

    span.addEventListener('click', (e) => {
        e.stopPropagation();
        if (span.dataset.mode === 'suggest') {
            const isApplied = span.classList.toggle('applied');
            if (isApplied) {
                span.textContent = span.dataset.replaced;
                showToast(span.dataset.replaced);
            } else {
                span.textContent = span.dataset.original;
                showToast(span.dataset.original);
            }
        } else {
            const isReverted = span.classList.toggle('reverted');
            if (isReverted) {
                span.textContent = span.dataset.original;
                showToast(span.dataset.original);
            } else {
                span.textContent = span.dataset.replaced;
                showToast(span.dataset.replaced);
            }
        }
        updateStats();
    });

    return span;
}

// Modal Handlers
btnOpenRules.addEventListener('click', () => {
    hideFloatingMenu();
    modalOverlay.classList.add('open');
    inputFrom.focus();
});

btnCloseRules.addEventListener('click', () => {
    modalOverlay.classList.remove('open');
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.remove('open');
    }
});

btnAddRule.addEventListener('click', () => {
    const mode = selectRuleMode ? selectRuleMode.value : 'auto';
    addRule(inputFrom.value, inputTo.value, mode);
    inputFrom.value = '';
    inputTo.value = '';
    inputFrom.focus();
});

inputTo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        btnAddRule.click();
    }
});

// Export Rules to JSON file
btnExportRules.addEventListener('click', () => {
    const dataStr = JSON.stringify(replacementRules, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice_typing_rules_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Rules exported');
});

// Import Rules from JSON file
btnImportRules.addEventListener('click', () => {
    fileImportRules.click();
});

fileImportRules.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            const normalized = normalizeRules(imported);
            if (normalized.length > 0) {
                replacementRules = normalized;
                saveRules();
                renderRulesList();
                showToast(`${normalized.length} rules imported`);
            } else {
                alert('No valid rules found in file.');
            }
        } catch (err) {
            alert('Invalid JSON file.');
        }
        fileImportRules.value = '';
    };
    reader.readAsText(file);
});

loadRules();

// --------------------------------------------------------------------------
// 2. Continuous Voice Typing Engine (Google Speech Recognition)
// --------------------------------------------------------------------------
function initSpeechRecognition() {
    if (!SpeechRecognition) {
        btnMic.style.display = 'none';
        lblStatus.textContent = 'Speech Recognition Not Supported';
        alert('Voice Typing is supported in Google Chrome, Microsoft Edge, and Chromium browsers.');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectMicLang.value;

    recognition.onstart = () => {
        isListening = true;
        btnMic.classList.add('listening');
        micLabel.textContent = 'Listening...';
        lblStatus.textContent = `Listening (${selectMicLang.value})...`;
        lblStatus.classList.add('listening');
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

        // Live interim feedback
        updateInterimPreview(interimTranscript);

        // If user resumes speaking while countdown is running,
        // cancel timer so previous comma remains as a comma!
        if (interimTranscript.trim() && punctuationTimer) {
            clearTimeout(punctuationTimer);
            punctuationTimer = null;
        }

        // Apply smart punctuation & dictionary replacements to finalized speech
        if (finalTranscript.trim()) {
            let clean = finalTranscript.trim();
            // Strip any trailing punctuation that browser engine may have attached
            clean = clean.replace(/[.,!?;:।|\s]+$/, '').trim();
            if (clean) {
                insertFinalText(clean);
            }
        }
    };

    recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
            alert('Microphone access was denied. Please allow microphone permission in your browser address bar.');
            stopVoiceTyping();
        }
    };

    recognition.onend = () => {
        // Auto-restart recognition so the microphone stays open continuously
        if (isListening) {
            try {
                recognition.start();
            } catch (e) {}
        } else {
            resetMicUI();
        }
    };
}

// --------------------------------------------------------------------------
// Smart Punctuation & Editor Helpers
// --------------------------------------------------------------------------
function getFullStopSymbol() {
    const lang = selectMicLang.value || 'hi-IN';
    return lang.startsWith('hi') ? '। ' : '. ';
}

function getEditorTrailingText() {
    let fullText = '';
    for (let i = 0; i < editor.childNodes.length; i++) {
        const node = editor.childNodes[i];
        if (node === interimSpan) continue;
        fullText += node.textContent || '';
    }
    return fullText;
}

function finalizeSentencePunctuation() {
    if (punctuationTimer) {
        clearTimeout(punctuationTimer);
        punctuationTimer = null;
    }

    // Traverse editor childNodes backwards for the last finalized text node
    for (let i = editor.childNodes.length - 1; i >= 0; i--) {
        const node = editor.childNodes[i];
        if (node === interimSpan) continue;
        if (node.nodeType === Node.TEXT_NODE) {
            const val = node.nodeValue || '';
            // If trailing characters are comma (English , or Arabic/Urdu ،) + optional space
            if (/[,\u060C]\s*$/.test(val)) {
                const fullStop = getFullStopSymbol();
                node.nodeValue = val.replace(/[,\u060C]\s*$/, fullStop);
                updateStats();
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
        if (!editor.contains(interimSpan)) {
            editor.appendChild(interimSpan);
        }
        interimSpan.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        if (editor.contains(interimSpan)) {
            editor.removeChild(interimSpan);
        }
    }
}

function insertFinalText(rawText) {
    hideFloatingMenu();
    if (punctuationTimer) {
        clearTimeout(punctuationTimer);
        punctuationTimer = null;
    }

    if (editor.contains(interimSpan)) {
        editor.removeChild(interimSpan);
    }

    const trailingText = getEditorTrailingText();
    const needsLeadingSpace = trailingText.length > 0 && !/\s$/.test(trailingText);
    const prefix = needsLeadingSpace ? ' ' : '';

    const segments = parseReplacementSegments(rawText, replacementRules);
    const fragment = document.createDocumentFragment();

    if (prefix) {
        fragment.appendChild(document.createTextNode(prefix));
    }

    segments.forEach(seg => {
        if (seg.type === 'text') {
            fragment.appendChild(document.createTextNode(seg.text));
        } else if (seg.type === 'replaced') {
            fragment.appendChild(createReplacedWordSpan(seg.original, seg.target, seg.mode));
        }
    });

    // Append trailing comma
    fragment.appendChild(document.createTextNode(', '));

    editor.appendChild(fragment);

    // Auto-scroll to keep bottom visible while speaking
    editor.scrollTop = editor.scrollHeight;
    updateStats();

    // Start 4-second countdown:
    // If silence lasts > 4 seconds, convert trailing comma to full stop ('।' or '.')
    punctuationTimer = setTimeout(() => {
        finalizeSentencePunctuation();
    }, PAUSE_DURATION_MS);
}

function startVoiceTyping() {
    if (!recognition) initSpeechRecognition();
    if (!recognition) return;

    try {
        recognition.lang = selectMicLang.value;
        recognition.start();
    } catch (e) {
        try {
            recognition.stop();
            setTimeout(() => recognition.start(), 200);
        } catch (err) {}
    }
}

function stopVoiceTyping() {
    isListening = false;
    finalizeSentencePunctuation();
    if (recognition) {
        try {
            recognition.stop();
        } catch (e) {}
    }
    resetMicUI();
}

function resetMicUI() {
    isListening = false;
    btnMic.classList.remove('listening');
    micLabel.textContent = 'Start';
    lblStatus.textContent = 'Ready';
    lblStatus.classList.remove('listening');
    updateInterimPreview('');
}

btnMic.addEventListener('click', () => {
    if (isListening) {
        stopVoiceTyping();
    } else {
        startVoiceTyping();
    }
});

selectMicLang.addEventListener('change', () => {
    finalizeSentencePunctuation();
    if (isListening) {
        stopVoiceTyping();
        setTimeout(startVoiceTyping, 250);
    }
});

initSpeechRecognition();

// --------------------------------------------------------------------------
// 3. Word & Character Statistics
// --------------------------------------------------------------------------
function updateStats() {
    const rawText = editor.innerText || '';
    const trimmed = rawText.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const chars = rawText.length;

    lblWordCount.textContent = `${words} word${words === 1 ? '' : 's'}`;
    lblCharCount.textContent = `${chars} character${chars === 1 ? '' : 's'}`;
}

editor.addEventListener('input', updateStats);

// --------------------------------------------------------------------------
// 4. Utility Actions (Copy, Save, Clear)
// --------------------------------------------------------------------------
function showToast(msg) {
    toastMessage.textContent = msg;
    toastMessage.classList.add('show');
    setTimeout(() => {
        toastMessage.classList.remove('show');
    }, 2200);
}

// One-Click Copy
btnCopy.addEventListener('click', async () => {
    finalizeSentencePunctuation();
    const text = editor.innerText || '';
    if (!text.trim()) {
        showToast('Nothing to copy');
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied');
    } catch (e) {
        showToast('Copy failed');
    }
});

// Download as .txt
btnDownload.addEventListener('click', () => {
    finalizeSentencePunctuation();
    const text = editor.innerText || '';
    if (!text.trim()) {
        showToast('Nothing to save');
        return;
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice_notes_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Saved');
});

// Clear
btnClear.addEventListener('click', () => {
    hideFloatingMenu();
    if (punctuationTimer) {
        clearTimeout(punctuationTimer);
        punctuationTimer = null;
    }
    if (isListening) stopVoiceTyping();
    editor.innerHTML = '';
    updateStats();
    editor.focus();
    showToast('Cleared');
});

// --------------------------------------------------------------------------
// 5. Floating Contextual Action Menu (Selection & Caret)
// --------------------------------------------------------------------------
let caretMenuTimer = null;

function clearCaretMenuTimer() {
    if (caretMenuTimer) {
        clearTimeout(caretMenuTimer);
        caretMenuTimer = null;
    }
}

function hideFloatingMenu() {
    clearCaretMenuTimer();
    if (!floatingMenu) return;
    floatingMenu.classList.remove('visible');
    floatingMenu.classList.remove('placed-bottom');
}

function positionFloatingMenu(centerX, anchorTop, anchorBottom) {
    if (!floatingMenu) return;

    floatingMenu.style.visibility = 'hidden';
    floatingMenu.classList.add('visible');

    const menuWidth = floatingMenu.offsetWidth || 160;
    const menuHeight = floatingMenu.offsetHeight || 38;

    const margin = 12;
    let left = centerX - menuWidth / 2;
    left = Math.max(margin, Math.min(window.innerWidth - menuWidth - margin, left));

    let top = anchorTop - menuHeight - 10;
    let placedBottom = false;

    // Avoid collision with floating top toolbar (around top: 16px to 65px)
    if (top < 75) {
        top = anchorBottom + 10;
        placedBottom = true;
    }

    if (top + menuHeight > window.innerHeight - 50) {
        top = Math.max(75, window.innerHeight - menuHeight - 50);
    }

    floatingMenu.style.left = `${Math.round(left)}px`;
    floatingMenu.style.top = `${Math.round(top)}px`;

    if (placedBottom) {
        floatingMenu.classList.add('placed-bottom');
    } else {
        floatingMenu.classList.remove('placed-bottom');
    }

    floatingMenu.style.visibility = 'visible';
}

function showFloatingMenuForSelection(range) {
    if (!range || !floatingMenu) return;
    clearCaretMenuTimer();
    savedSelectionRange = range.cloneRange();

    btnFloatCopy.classList.remove('hidden');
    btnFloatDelete.classList.remove('hidden');
    btnFloatPaste.classList.remove('hidden');

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
        const clientRects = range.getClientRects();
        if (clientRects.length > 0) {
            const first = clientRects[0];
            positionFloatingMenu(first.left + first.width / 2, first.top, first.bottom);
            return;
        }
        hideFloatingMenu();
        return;
    }

    positionFloatingMenu(rect.left + rect.width / 2, rect.top, rect.bottom);
}

function showFloatingMenuForCaret(clickX, clickY) {
    if (!floatingMenu) return;
    clearCaretMenuTimer();

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    savedSelectionRange = sel.getRangeAt(0).cloneRange();

    btnFloatCopy.classList.add('hidden');
    btnFloatDelete.classList.add('hidden');
    btnFloatPaste.classList.remove('hidden');

    const rect = savedSelectionRange.getBoundingClientRect();
    let x = clickX;
    let top = clickY;
    let bottom = clickY;

    if (rect.height > 0) {
        x = rect.left;
        top = rect.top;
        bottom = rect.bottom;
    }

    positionFloatingMenu(x, top, bottom);

    // Auto-dismiss single-click caret popup after 1 second if user does not interact
    caretMenuTimer = setTimeout(() => {
        hideFloatingMenu();
    }, 1000);
}

// Pause/resume 1-second auto-dismiss on mouse hover over floating menu
if (floatingMenu) {
    floatingMenu.addEventListener('mouseenter', () => {
        clearCaretMenuTimer();
    });

    floatingMenu.addEventListener('mouseleave', () => {
        // If still in single-click caret mode, restart 1-second timer
        if (floatingMenu.classList.contains('visible') && btnFloatCopy.classList.contains('hidden')) {
            clearCaretMenuTimer();
            caretMenuTimer = setTimeout(() => {
                hideFloatingMenu();
            }, 1000);
        }
    });
}

// Prevent buttons on floating menu from stealing focus or clearing selection
[floatingMenu, btnFloatCopy, btnFloatPaste, btnFloatDelete].forEach(el => {
    if (el) {
        el.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
    }
});

// Copy Selected Text
btnFloatCopy.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const sel = window.getSelection();
    const text = sel ? sel.toString() : (savedSelectionRange ? savedSelectionRange.toString() : '');
    if (text) {
        try {
            await navigator.clipboard.writeText(text);
            showToast('Copied');
        } catch (err) {
            showToast('Copy failed');
        }
    }
    hideFloatingMenu();
});

// Delete Selected Text
btnFloatDelete.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const sel = window.getSelection();
    if (savedSelectionRange) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRange);
        savedSelectionRange.deleteContents();
        updateStats();
        showToast('Deleted');
    } else if (sel && !sel.isCollapsed) {
        sel.deleteFromDocument();
        updateStats();
        showToast('Deleted');
    }
    hideFloatingMenu();
});

// Helper: Inspect boundary characters before and after insertion range
function getCharBeforeRange(range, container) {
    if (!range || !container) return null;
    try {
        const preRange = document.createRange();
        preRange.setStart(container, 0);
        preRange.setEnd(range.startContainer, range.startOffset);
        const str = preRange.toString();
        return str.length > 0 ? str.slice(-1) : null;
    } catch (e) {
        return null;
    }
}

function getCharAfterRange(range, container) {
    if (!range || !container) return null;
    try {
        const postRange = document.createRange();
        postRange.setStart(range.endContainer, range.endOffset);
        postRange.setEnd(container, container.childNodes.length);
        const str = postRange.toString();
        return str.length > 0 ? str.charAt(0) : null;
    } catch (e) {
        return null;
    }
}

// Helper: Ensure pasted text has automatic spacing if words would collide
function formatPastedTextWithSmartSpaces(rawText, range, container) {
    if (!rawText) return rawText;
    let text = rawText;

    const charBefore = range ? getCharBeforeRange(range, container) : null;
    const charAfter = range ? getCharAfterRange(range, container) : null;

    // Preceding check: if charBefore exists and is not whitespace, and text doesn't start with whitespace
    if (charBefore !== null && !/\s/.test(charBefore) && !/^\s/.test(text)) {
        // Don't add leading space if pasted text starts with punctuation that attaches to previous word
        if (!/^[.,!?;:।%')\]}]/.test(text)) {
            text = ' ' + text;
        }
    }

    // Following check: if charAfter exists and is not whitespace, and text doesn't end with whitespace
    if (charAfter !== null && !/\s/.test(charAfter) && !/\s$/.test(text)) {
        // Don't add trailing space if charAfter is punctuation that attaches to pasted word
        if (!/^[.,!?;:।%')\]}]/.test(charAfter)) {
            text = text + ' ';
        }
    }

    return text;
}

// Paste Clipboard Text (Replaces selection OR inserts at caret with smart spacing)
btnFloatPaste.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearCaretMenuTimer();

    let rawText = '';
    try {
        rawText = await navigator.clipboard.readText();
    } catch (err) {
        console.warn('Clipboard read error:', err);
        showToast('Clipboard access needed');
        hideFloatingMenu();
        return;
    }

    if (!rawText) {
        showToast('Clipboard is empty');
        hideFloatingMenu();
        return;
    }

    const sel = window.getSelection();
    let range = savedSelectionRange;
    if (!range && sel && sel.rangeCount > 0) {
        range = sel.getRangeAt(0);
    }

    if (range) {
        editor.focus();
        sel.removeAllRanges();
        sel.addRange(range);

        // Format with smart spaces so adjacent words never stick together
        const finalText = formatPastedTextWithSmartSpaces(rawText, range, editor);

        // Delete any existing selected content
        range.deleteContents();

        // Insert new text
        const textNode = document.createTextNode(finalText);
        range.insertNode(textNode);

        // Advance cursor to end of pasted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(range);

        updateStats();
        showToast('Pasted');
    } else {
        editor.focus();
        const finalText = formatPastedTextWithSmartSpaces(rawText, null, editor);
        document.execCommand('insertText', false, finalText);
        updateStats();
        showToast('Pasted');
    }

    hideFloatingMenu();
});

// Intercept standard Paste (Ctrl+V / Context Menu Paste) for identical smart spacing
editor.addEventListener('paste', (e) => {
    hideFloatingMenu();
    const clipData = (e.clipboardData || window.clipboardData)?.getData('text');
    if (!clipData) return;

    e.preventDefault();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    const finalText = formatPastedTextWithSmartSpaces(clipData, range, editor);
    range.deleteContents();
    const textNode = document.createTextNode(finalText);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    sel.removeAllRanges();
    sel.addRange(range);

    updateStats();
    showToast('Pasted');
});

// Detect Selection or Single Click inside Editor
editor.addEventListener('mouseup', (e) => {
    // If clicked on a replaced word, do not show floating menu (word toggle handles itself)
    if (e.target.closest('.replaced-word')) {
        hideFloatingMenu();
        return;
    }

    setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || !editor.contains(sel.anchorNode)) {
            hideFloatingMenu();
            return;
        }

        const selectedText = sel.toString().trim();
        if (!sel.isCollapsed && selectedText.length > 0) {
            showFloatingMenuForSelection(sel.getRangeAt(0));
        } else {
            showFloatingMenuForCaret(e.clientX, e.clientY);
        }
    }, 15);
});

// Handle Keyboard Text Selection (Shift + Arrows, Ctrl + A)
editor.addEventListener('keyup', (e) => {
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

    setTimeout(() => {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.toString().trim().length > 0 && editor.contains(sel.anchorNode)) {
            showFloatingMenuForSelection(sel.getRangeAt(0));
        } else {
            hideFloatingMenu();
        }
    }, 15);
});

// Auto-hide on typing or scrolling
editor.addEventListener('input', hideFloatingMenu);
editor.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideFloatingMenu();
    } else if (!['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
        hideFloatingMenu();
    }
});

if (scrollContainer) {
    scrollContainer.addEventListener('scroll', hideFloatingMenu);
}
window.addEventListener('scroll', hideFloatingMenu);
window.addEventListener('resize', hideFloatingMenu);

// Hide when clicking outside editor and outside floating menu
document.addEventListener('mousedown', (e) => {
    if (floatingMenu && !floatingMenu.contains(e.target) && !editor.contains(e.target)) {
        hideFloatingMenu();
    }
});

// --------------------------------------------------------------------------
// 6. Keyboard Shortcuts
// --------------------------------------------------------------------------
document.addEventListener('keydown', (e) => {
    // Esc closes modal
    if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
        modalOverlay.classList.remove('open');
        return;
    }

    // Alt + V or F8 toggles Voice Typing
    if ((e.altKey && e.code === 'KeyV') || e.code === 'F8') {
        e.preventDefault();
        btnMic.click();
    }
});

updateStats();
