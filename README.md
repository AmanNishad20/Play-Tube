# PlayTube

A lightweight, YouTube-style video hub for playing **Google Drive videos** from a clean, responsive interface.

## Overview

PlayTube is a single-page web app with an Express + MongoDB backend that lets you:
- Add Google Drive video links with a custom title.
- Organize videos into sections.
- Browse a playlist in a sidebar.
- Stream the selected video in an embedded Drive preview player.
- Persist shared data in MongoDB so it can be used across devices.

## Features

- **Google Drive URL parsing**: Supports common Drive share link formats and converts them to preview URLs.
- **Section-based organization**: Group videos by custom sections.
- **Persistent storage**: Videos and sections are stored in MongoDB.
- **Responsive layout**: Optimized for desktop and mobile widths.
- **Resilient startup behavior**:
  - Handles malformed responses safely.
  - Uses a UUID fallback when `crypto.randomUUID()` is unavailable.

## Tech Stack

- HTML5
- CSS3
- React 18 (CDN)
- ReactDOM 18 (CDN)
- Babel Standalone (CDN, for in-browser JSX transpilation)
- Node.js + Express
- MongoDB + Mongoose

## Project Structure

```text
Play-Tube/
├── index.html      # App shell and CDN script imports
├── styles.css      # App styling and responsive rules
├── app.js          # React app logic
├── server.js       # Express API + static file serving
├── .env.example    # Environment variable examples
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- A MongoDB database (MongoDB Atlas recommended)

### Environment Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set:
   - `MONGODB_URI` to your MongoDB connection string.
   - `PORT` (optional for local dev; defaults to 3000).

### Run Locally

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## Deployment Guide

Below are platform-specific deployment steps.

### Deploy on Render (recommended)

1. Push this repository to GitHub/GitLab.
2. In Render, click **New +** → **Web Service**.
3. Connect your repository.
4. Use these settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Auto-Deploy**: Optional (recommended: On Commit)
5. Add environment variables in Render dashboard:
   - `MONGODB_URI` = your MongoDB URI
   - `PORT` is optional on Render (Render provides one automatically)
6. Click **Create Web Service** and wait for deployment.
7. Open your Render URL (for example `https://your-app.onrender.com`).

> **Render commands summary**
> - Build command: `npm install`
> - Start command: `npm start`

### Deploy on Vercel

Because this project runs a custom Express server (`server.js`), deploy it as a Node serverless function.

1. Add a `vercel.json` file (if you do not already have one):

   ```json
   {
     "version": 2,
     "builds": [
       { "src": "server.js", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/(.*)", "dest": "/server.js" }
     ]
   }
   ```

2. Push to GitHub and import the repo in Vercel.
3. In **Project Settings → Environment Variables**, add:
   - `MONGODB_URI`
4. Deploy.

If you prefer zero config for Node hosting, Render/Railway/Fly.io are often simpler for Express apps.

### Other platforms

#### Railway

1. Create a new Railway project from your GitHub repo.
2. Set environment variable `MONGODB_URI`.
3. Railway usually detects Node automatically.
4. Ensure start command is `npm start`.

#### Fly.io

1. Install Fly CLI and run:

   ```bash
   fly launch
   ```

2. Set secret:

   ```bash
   fly secrets set MONGODB_URI="your-mongodb-uri"
   ```

3. Deploy:

   ```bash
   fly deploy
   ```

## Usage

1. Open the app.
2. (If needed) configure a MongoDB URI in environment variables.
3. Create a section.
4. Enter a video title.
5. Paste a shareable Google Drive file URL.
6. Click **Add Video**.
7. Select videos from the sidebar to play.

### Google Drive Sharing Requirement

For videos to play correctly, the Drive file must be shared as:

- **“Anyone with the link can view.”**

## Validation Rules

- Title and URL are required.
- URL must contain a valid Google Drive file ID format.
- Section is required when adding a video.
- Invalid submissions show a user-facing helper message.

## Known Limitations

- Requires a reachable MongoDB instance for full functionality.
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
