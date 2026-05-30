# mindReset / Anchor

A biofeedback wellbeing MVP. Operator-driven session that walks a participant through **baseline → peak (hyperventilation) → optional natural recovery → intervention (calming track) → post**, with manual entry of five measures at each timepoint. Results screen shows per-measure deltas vs the natural-recovery control window, plus the raw session JSON.

Built for the EEG Wellness Hack (AWEAR + Vibes AI, a16z Boston Tech Week). Full spec: [`anchor_mvp_plan.md`](./anchor_mvp_plan.md).

Live: `https://amangang3.github.io/mindReset/`

## Measures (manual entry)

| Measure | Unit | Source |
|---|---|---|
| HR | bpm | pulse count / phone HR app / device |
| SUDS | 0–10 | participant self-report |
| HRV | ms | AWEAR app, transcribed |
| EEG score | units | AWEAR app, transcribed |
| Vibes AI | score | Vibes AI app, transcribed |

## Adding calming tracks

Drop audio files into `public/audio/calm/` and commit:

```bash
cp ~/Downloads/ocean.mp3 public/audio/calm/
git add public/audio/calm/ocean.mp3
git commit -m "add ocean track"
git push
```

The session setup screen exposes a picker over whatever's in `calm/`, defaulting to the first alphabetically. Other subfolders under `public/audio/` (e.g. `panic/`) are scanned into the manifest but ignored by the player. Switch the active pool by changing `ACTIVE_CATEGORY` in `src/App.jsx`.

Supported extensions: `.mp3 .m4a .aac .wav .ogg .oga .flac .webm`.

## Local dev

```bash
npm install
npm run dev
```

App at `http://localhost:5173/mindReset/`. The `predev` hook regenerates `public/audio/manifest.json` first.

## How it works

- `src/App.jsx` — stage state machine (`setup → baseline → induce → peak → natural? → intervention → post → results`).
- `src/session.js` — session shape (matches the spec data model) + delta math.
- `src/components/SetupStage.jsx` — participant, hyperventilation duration (20–60s), control-window toggle, track picker.
- `src/components/MeasurementStage.jsx` — reusable form (4 number inputs + 0–10 SUDS row), submits a reading.
- `src/components/CountdownStage.jsx` — reusable countdown ring. Used for hyperventilation, natural window, and intervention.
- `src/components/ResultsStage.jsx` — comparison table, recovery deltas, natural-recovery deltas side-by-side, caveats, copy/download JSON.
- `src/library.js` — fetches `public/audio/manifest.json`.
- `src/player.js` — Web Audio fade-out player. The intervention stage plays at `cap = Infinity` so it runs full length until the operator stops it.

## Tweak knobs

- Active category: `ACTIVE_CATEGORY` in `src/App.jsx` (default `'calm'`).
- Control-window duration: `CONTROL_WINDOW_SEC` in `src/App.jsx` (default `30`).
- Intervention duration: `INTERVENTION_SEC` in `src/App.jsx` (default `4 * 60`).
- Fade-out length on stop: `FADE_OUT_SEC` and `STOP_FADE_SEC` in `src/player.js`.

## Deploy

In the repo: **Settings → Pages → Source: GitHub Actions**. Push to `main`; the workflow builds and publishes.
