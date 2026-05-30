# Anchor — Biofeedback Wellbeing MVP Plan

A manual-logging app that demonstrates a wellbeing intervention measurably bringing a person back to baseline after an induced stress spike. Built for the EEG Wellness Hack at MIT (AWEAR + Vibes AI, a16z Boston Tech Week).

**Hackathon question it answers:** can we measure the impact of a calming intervention on a real person in the room?

---

## Scope

**In (the one-day build):**
- Manual entry of four measures at each timepoint.
- Local sound playback: pick one calming track per session, from bundled files. The stressor is participant-driven (hyperventilation), so there is no stressor track.
- A guided operator flow through the experiment stages.
- A results screen comparing timepoints, with deltas and honest caveats.

**Out (production roadmap, not this build):**
- Live sensor connection (AWEAR EEG, HRV strap). Numbers are transcribed by hand.
- Real-time HRV computation, automatic cue triggering, cloud storage, accounts.

**Open decisions (defaulted, change if needed):**
- Control window: included as an optional toggle. Recommended on.
- Calming-track delivery: bundled local files with a picker and a preselected default. Alternative is operator-upload via file picker.

---

## Measures

All five are entered by hand at each timepoint. HRV, EEG score, and the Vibes AI score are read off their source device or app and transcribed; the app does not connect to sensors.

| Measure | Unit | Source | Moves under stress | Role |
|---|---|---|---|---|
| Heart rate | bpm | Pulse count, phone HR app, or device readout | Up | Objective, coarse |
| SUDS | 0–10 | Participant self-report | Up | Subjective headline |
| HRV | ms | AWEAR app / HRV reading, transcribed | Down | Objective, slower |
| EEG score | device units | AWEAR app, transcribed | Varies | On-theme objective |
| Vibes AI score | score | Vibes AI app, transcribed | Down / varies | Platform impact metric — directly answers "measure with Vibes AI" |

Note: manual entry means whoever types the value knows the expected result, so operator bias is present. Name it in the pitch. SUDS is subjective and prone to demand effects; pair it with HR so the story is not self-report alone.

---

## Experiment flow

Three measurement points: **baseline → peak (after stressor) → post (after intervention)**, plus an optional control reading.

1. **Baseline measurement.** Participant sits still 60–90s, normal breathing. Operator records HR, SUDS, HRV, EEG score, and Vibes AI score. Mark t=0.
2. **Stress induction + peak measurement.** Participant hyperventilates (fast, deep breathing) while seated, for a duration the operator sets with a slider (e.g. 20–60s), with a visible countdown. The moment it ends, record all five at peak arousal. Speed matters: arousal starts decaying within seconds. Stop early if the participant feels faint.
3. **Control window (optional, recommended).** 30s of quiet, normal breathing, no intervention. Take one reading. This shows how much they recover on their own and is your defense against the "they calmed down anyway" critique. Toggle off for the fast demo.
4. **Intervention.** Operator picks and plays a calming track (Vibes AI). Participant runs a paced-breath or chosen practice for a set 3–4 min.
5. **Recording results.** Record all five at post. App computes deltas and shows the comparison.

---

## Data model

One session logs:

```json
{
  "session_id": "string",
  "participant": "string",
  "timestamp": "ISO-8601",
  "hyperventilation_seconds": 45,
  "calming_track": "filename",
  "control_window": true,
  "readings": {
    "baseline": { "hr": null, "suds": null, "hrv": null, "eeg": null, "vibes": null, "t": 0 },
    "peak":     { "hr": null, "suds": null, "hrv": null, "eeg": null, "vibes": null, "t": null },
    "natural":  { "hr": null, "suds": null, "hrv": null, "eeg": null, "vibes": null, "t": null },
    "post":     { "hr": null, "suds": null, "hrv": null, "eeg": null, "vibes": null, "t": null }
  }
}
```

Each reading captures its own timestamp so you can report time-to-baseline (peak to post).

---

## Results screen

A baseline → peak → post table for all four measures, plus a deltas block:

- **SUDS drop** (peak minus post) — your headline.
- **HRV recovery** as percent of baseline.
- **HR change** (peak minus post).
- **EEG score shift** (post minus baseline).
- **Vibes AI score shift** (post minus peak) — the platform metric the prompt asks for.
- **Time to baseline** (peak timestamp to post timestamp).
- **Natural recovery** from the control window, shown beside the app recovery for direct comparison.

"Impact" = the gap between post and peak, weighed against the natural-window reading.

---

## Build tasks

Default to the no-hardware path so the demo never depends on a connection.

1. App shell with the five-stage flow and a stage indicator.
2. Manual-entry form per timepoint: HR, HRV, EEG, and Vibes AI score number inputs plus a 0–10 SUDS tap row.
3. Hyperventilation timer with an operator-set duration slider (range 20–60s) and a large visible countdown plus a stop button. One calming-track player: picker, preselected default, play and stop.
4. Session store in memory holding the readings object above.
5. Results screen: the comparison table, the deltas block, and the caveat text.
6. Control-window toggle that adds or skips the natural reading.
7. Export or copy of the session JSON so results survive the demo.
8. Stretch: a simple line or bar showing baseline, peak, and post for one measure.

---

## Methodology and honest caveats

State these out loud; the team that names its limits reads as more competent.

- **Decay confound.** Acoustic arousal fades on its own. Without the control window you cannot separate the app's effect from natural recovery. This is why the window is recommended on.
- **Demand effects.** Participants report feeling calmer because they expect to. SUDS is most exposed to this.
- **Operator bias.** Manual entry by someone who knows the expected result. Acknowledge it.
- **Paced breathing inflates HRV mechanically** through respiratory sinus arrhythmia, so part of any HRV rise is the breathing pattern, not deeper calm.
- **n=1, single session.** A directional signal, not evidence.
- **Hyperventilation safety.** Voluntary overbreathing causes dizziness, tingling, and in some people faintness. Keep the participant seated, cap the slider (60s is plenty), screen out anyone with heart, respiratory, anxiety, seizure conditions, or who is pregnant, and stop the moment they feel unwell.

---

## Production roadmap

- AWEAR behind-ear EEG streaming the EEG score live.
- HRV from a chest strap with rolling RMSSD, replacing transcription.
- Automatic cue when the signal returns to baseline.
- A panic-button launch that opens the app and starts the intervention from a lock screen or device gesture, recovering against a saved baseline.

---

## Pitch framing

Run it live on a willing person. Spike them, show all five numbers move, run the calming track, show them come back, then put the natural-window number next to the app number and let the contrast carry the claim.

## To confirm

- Is the HRV / EEG-score transcription model correct, or are those measures coming from somewhere else?
- Keep the control window on for the judged run?
- Bundled calming track, or operator-upload?
