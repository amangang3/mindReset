# mindReset

One-tap calming sound player. Picks a random clip from `public/audio/` and plays it with a fade-out at 15 / 30 / 60 seconds (or full length).

Live: `https://amangang3.github.io/mindReset/`

## Adding tracks

Drop audio files into `public/audio/calm/` and commit. The app picks randomly from whatever's in there:

```bash
cp ~/Downloads/ocean.mp3 public/audio/calm/
git add public/audio/calm/ocean.mp3
git commit -m "add ocean track"
git push
```

The active category is `calm` (set by `ACTIVE_CATEGORY` in `src/App.jsx`). Other subfolders under `public/audio/` (e.g. `panic/`) are scanned into the manifest but ignored by the player. To switch the active pool, change `ACTIVE_CATEGORY`.

Supported extensions: `.mp3 .m4a .aac .wav .ogg .oga .flac .webm`. On push, the GitHub Actions workflow regenerates `public/audio/manifest.json` and deploys.

Locally, `npm run dev` and `npm run build` regenerate the manifest automatically (`predev` / `prebuild` scripts).

## Local dev

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173/mindReset/`.

## How it works

- `public/audio/*` — audio files committed to the repo, served as static assets.
- `scripts/build-manifest.mjs` — scans `public/audio/` and writes `manifest.json`. Runs automatically before `dev` and `build`.
- `src/library.js` — fetches `manifest.json` at startup, builds same-origin URLs for `<audio>`.
- `src/player.js` — one `HTMLAudioElement` routed through a Web Audio `GainNode`. At `cap - 2s` it ramps gain to 0 over 2s, then pauses at `cap`. Tapping the button mid-play fades the current clip and starts a new random one.
- `src/App.jsx` — big button + 15/30/60/full toggle + volume slider.

## Tweak knobs

- Fade-out length: `FADE_OUT_SEC` in `src/player.js`.
- Cap options / default cap: `CAP_OPTIONS` and `useState(30)` in `src/App.jsx`.
- Allowed extensions: `allowed` set in `scripts/build-manifest.mjs`.

## Large files

If you have tracks > ~25 MB, consider [Git LFS](https://git-lfs.com) so the repo doesn't bloat:

```bash
git lfs install
git lfs track "public/audio/*.mp3" "public/audio/*.wav"
git add .gitattributes
```

GitHub Pages serves LFS-tracked files normally — no extra config.

## Deploy setup (one-time)

In the repo on github.com: **Settings → Pages → Source: GitHub Actions**. After the first push to `main`, the workflow publishes to `https://amangang3.github.io/mindReset/`.
