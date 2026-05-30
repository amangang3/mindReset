import { useState } from 'react'

export default function SetupStage({ tracks, onStart }) {
  const [participant, setParticipant] = useState('')
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
          calmingTrack: trackFile,
        })
      }}
    >
      <h1>Anchor</h1>
      <p className="subtitle">Two phases. Same stressor. Recover naturally, then with the intervention.</p>

      <ol className="phase-preview">
        <li>
          <strong>1. Baseline</strong>
          <span>Rest → hyperventilate (2 min) → natural recovery (2 min)</span>
        </li>
        <li>
          <strong>2. Intervention</strong>
          <span>Hyperventilate (2 min) → calming track + paced breath (2 min)</span>
        </li>
      </ol>

      <p className="field-hint">Every timed step is 2 minutes. Keep participant seated; stop early if dizzy.</p>

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
        <span className="field-label">Calming track (Phase 2)</span>
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
        Start Phase 1
      </button>
    </form>
  )
}
