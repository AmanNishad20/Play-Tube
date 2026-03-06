# PlayTube

A lightweight, YouTube-style video hub for playing **Google Drive videos** from a clean, responsive interface.

## Overview

PlayTube is a single-page web app built with React (via CDN) that lets you:
- Add Google Drive video links with a custom title.
- Browse a playlist in a sidebar.
- Stream the selected video in an embedded Drive preview player.
- Persist your video library locally in the browser using `localStorage`.

## Features

- **Google Drive URL parsing**: Supports common Drive share link formats and converts them to preview URLs.
- **Simple playlist management**: Quickly add and switch between videos.
- **Persistent storage**: Videos remain available across page reloads.
- **Responsive layout**: Optimized for desktop and mobile widths.
- **Resilient startup behavior**:
  - Handles malformed `localStorage` data safely.
  - Uses a UUID fallback when `crypto.randomUUID()` is unavailable.

## Tech Stack

- HTML5
- CSS3
- React 18 (CDN)
- ReactDOM 18 (CDN)
- Babel Standalone (CDN, for in-browser JSX transpilation)

## Project Structure

```text
Play-Tube/
├── index.html      # App shell and CDN script imports
├── styles.css      # App styling and responsive rules
├── app.js          # React app logic
└── README.md
```

## Getting Started

### Prerequisites

- Any modern browser.
- Optional: a local static file server (recommended).

### Run Locally

Because this app loads JavaScript modules from local files, serve it with a static server:

```bash
# Option 1: Python
python3 -m http.server 8080

# Option 2: Node (if installed)
npx serve .
```

Then open:

- `http://localhost:8080` (Python)
- or the URL provided by `serve`.

> You can also open `index.html` directly in some browsers, but using a local server is more reliable.

## Usage

1. Open the app.
2. Enter a video title.
3. Paste a shareable Google Drive file URL.
4. Click **Add Video**.
5. Select videos from the sidebar to play.

### Google Drive Sharing Requirement

For videos to play correctly, the Drive file must be shared as:

- **“Anyone with the link can view.”**

## Validation Rules

- Title and URL are required.
- URL must contain a valid Google Drive file ID format.
- Invalid submissions show a user-facing helper message.

## Known Limitations

- No backend: all data is browser-local and device-specific.
- No authentication or private Drive API integration.
- No advanced playlist operations (edit, delete, reorder) yet.

## Future Improvements

- Add edit/delete/reorder actions for videos.
- Add duplicate link detection.
- Add search/filter in playlist.
- Add import/export for playlist backups.
- Add automated unit and E2E tests.

## License

This project is currently unlicensed. Add a `LICENSE` file to define usage terms.
