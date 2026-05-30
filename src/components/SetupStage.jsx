import { useState } from 'react'

export default function SetupStage({ tracks, onStart }) {
  const [participant, setParticipant] = useState('')
  const [duration, setDuration] = useState(45)
  const [controlWindow, setControlWindow] = useState(true)
  const [trackFile, setTrackFile] = useState(tracks[0]?.file ?? '')

  const canStart = tracks.length > 0 && trackFile

  return (
    <form
      className="stage stage-setup"
      onSubmit={(e) => {
        e.preventDefault()
        if (!canStart) return
        onStart({
          participant: participant.trim() || 'anonymous',
          hyperventilationSeconds: duration,
          controlWindow,
          calmingTrack: trackFile,
        })
      }}
    >
      <h1>Anchor</h1>
      <p className="subtitle">Spike → recover. Measure the gap.</p>

      <label className="field">
        <span className="field-label">Participant</span>
        <input
          type="text"
          value={participant}
          onChange={(e) => setParticipant(e.target.value)}
          placeholder="initials or alias"
        />
      </label>

      <label className="field">
        <span className="field-label">
          Hyperventilation duration <strong>{duration}s</strong>
        </span>
        <input
          type="range"
          min={20}
          max={60}
          step={5}
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value, 10))}
        />
        <span className="field-hint">Keep them seated. Stop early if dizzy.</span>
      </label>

      <label className="field checkbox-field">
        <input
          type="checkbox"
          checked={controlWindow}
          onChange={(e) => setControlWindow(e.target.checked)}
        />
        <span>
          <strong>Control window</strong>
          <span className="field-hint"> — 30s of natural recovery before the intervention</span>
        </span>
      </label>

      <label className="field">
        <span className="field-label">Calming track</span>
        <select value={trackFile} onChange={(e) => setTrackFile(e.target.value)} disabled={tracks.length === 0}>
          {tracks.length === 0 && <option value="">No tracks in public/audio/calm/</option>}
          {tracks.map((t) => (
            <option key={t.file} value={t.file}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" className="primary-btn" disabled={!canStart}>
        Start session
      </button>
    </form>
  )
}
