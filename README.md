# Voice Typing Studio

A dedicated, distraction-free in-browser Voice Typing (Speech-to-Text) Studio with continuous voice recognition, real-time feedback, and a smart auto-replace dictionary for custom word corrections.

## Features
- **Continuous Speech Recognition**:
  - Uses native Chromium `webkitSpeechRecognition` engine.
  - Auto-restarts continuously without unexpected cutoffs.
  - Supports Hindi (`hi-IN`), English (`en-IN`), and English (`en-US`).
  - Shortcut: **`Alt + V`** or **`F8`** to toggle recording.
- **Smart Punctuation & Silence Countdown**:
  - Automatically appends a comma on natural pauses.
  - Converts comma to full stop (`।` in Hindi, `.` in English) after 4 seconds of silence.
- **Dual-Mode Dictionary (Auto & Suggest)**:
  - **Auto**: Replaces spoken triggers automatically (cyan highlight, hover shows original, click reverts).
  - **Suggest**: Keeps original spoken word (violet highlight, hover shows suggestion, click applies).
  - Multi-alias triggers (e.g. `पायथन, पाइथन` ➔ `Python`).
  - JSON Export & Import for backup across devices.
  - Safe deletion with confirmation dialogs.
- **Floating Contextual Quick Actions**:
  - Select text for instant **Copy**, **Paste** (replaces selection with clipboard), and **Delete**.
  - Single-click anywhere in the editor to instantly **Paste** clipboard text at the cursor.
- **Minimalist Design**:
  - Apple & Linear-inspired dark obsidian aesthetic.
  - Ultra-clean toolbar, statistics, copy, save, and clear tools.
- **100% Client-Side**: No servers required. Deploy directly on GitHub Pages.

## Project Structure
```text
├── index.html            # Main HTML structure
├── style.css             # Dark theme, full-width canvas, mic button & modal styles
├── app.js                # Core SpeechRecognition, auto-replace dictionary, stats
├── favicon.svg           # High-resolution vector favicon
├── favicon.png           # 256x256 browser favicon
├── apple-touch-icon.png  # 180x180 mobile homescreen icon
├── favicon.ico           # Classic favicon
└── README.md             # Project documentation
```

## How to Run
Double-click `index.html` to open in Chrome or Microsoft Edge.
