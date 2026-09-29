# Study Space

A calm digital study desk — spatial workspace PWA.

Place PDFs, videos, images, notes and tools freely on a large off-white dotted canvas.

## Features

- **Spatial canvas** — pan, zoom, drag, resize objects
- **PDF viewer** — real rendering via PDF.js, page navigation, zoom
- **YouTube videos** — embed playable video objects
- **Images & text** — movable, resizable content objects
- **Sticky notes** — glass-styled notes with subtle color variants
- **Pen tool** — draw on the workspace with undo/redo
- **Focus mode** — reduce distractions around selected content
- **Calculator** — compact floating arithmetic tool
- **Pomodoro** — work/break timer with subtle grid wave effect
- **DABSy** — quiet companion window with local context awareness
- **Ecosystem bridges** — event adapters for SolveCount & Ghibli Calendar
- **Local-first** — IndexedDB storage, no account required
- **Installable PWA** — works offline for local content
- **GitHub Pages ready** — relative paths throughout

## Quick start

1. Upload this folder to a GitHub repository
2. Enable **GitHub Pages** (Settings → Pages → Deploy from branch → `/` root)
3. Open the published URL
4. Install as PWA from the browser if desired

For local testing:

```bash
# Any static server
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Design principles

- Content > interface
- Quiet glassmorphism
- Warm off-white desk with subtle dotted grid
- Mobile-first, touch-friendly
- No dashboard clutter

## Architecture

```
study-space/
├── index.html
├── manifest.json
├── sw.js
├── styles/          # design tokens + modular CSS
├── scripts/
│   ├── app.js
│   ├── canvas-engine.js
│   ├── object-manager.js
│   ├── objects/     # PDF, video, image, text, sticky, fallback
│   ├── tools/       # pen, focus, calculator, menus
│   ├── pomodoro/
│   ├── dabsy/
│   ├── ecosystem/   # SolveCount + Calendar bridges
│   ├── storage/     # IndexedDB layer
│   └── utilities/
└── assets/icons/
```

## Privacy

All local study material stays in your browser (IndexedDB).  
Nothing is uploaded unless you use an external service (e.g. YouTube embeds).

## License

Use freely for personal study. Built as a static PWA for GitHub Pages.
