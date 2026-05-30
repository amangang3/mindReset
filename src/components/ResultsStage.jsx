import { useMemo, useState } from 'react'
import { MEASURE_KEYS, MEASURE_LABELS, computeDeltas, formatSeconds } from '../session.js'

const STAGES = [
  { key: 'baseline', label: 'Baseline' },
  { key: 'peak', label: 'Peak' },
  { key: 'natural', label: 'Natural' },
  { key: 'post', label: 'Post' },
]

function val(v) {
  return v == null ? '—' : v
}

function signed(v) {
  if (v == null) return '—'
  return v > 0 ? `+${v}` : `${v}`
}

export default function ResultsStage({ session, onRestart }) {
  const { recovery, natural_recovery } = useMemo(() => computeDeltas(session), [session])
  const [copied, setCopied] = useState(false)
  const json = useMemo(() => JSON.stringify(session, null, 2), [session])

  const stagesShown = STAGES.filter((s) => s.key !== 'natural' || session.control_window)

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fall back to download
      downloadJson()
    }
  }

  function downloadJson() {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `anchor-${session.session_id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="stage stage-results">
      <h2>Results</h2>
      <p className="hint">
        Track: <strong>{session.calming_track || '—'}</strong> · Participant:{' '}
        <strong>{session.participant}</strong>
      </p>

      <div className="results-table-wrap">
        <table className="results-table">
          <thead>
            <tr>
              <th></th>
              {stagesShown.map((s) => (
                <th key={s.key}>{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEASURE_KEYS.map((k) => (
              <tr key={k}>
                <th>{MEASURE_LABELS[k]}</th>
                {stagesShown.map((s) => (
                  <td key={s.key}>{val(session.readings[s.key][k])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="deltas">
        <h3>Recovery (peak → post)</h3>
        <ul>
          <li>SUDS drop: <strong>{signed(recovery.suds_drop)}</strong></li>
          <li>HR change: <strong>{signed(recovery.hr_change)} bpm</strong></li>
          <li>HRV vs baseline: <strong>{recovery.hrv_recovery_pct == null ? '—' : `${recovery.hrv_recovery_pct}%`}</strong></li>
          <li>EEG shift (post − baseline): <strong>{signed(recovery.eeg_shift)}</strong></li>
          <li>Vibes AI shift (post − peak): <strong>{signed(recovery.vibes_shift)}</strong></li>
          <li>Time peak → post: <strong>{formatSeconds(recovery.time_to_baseline_sec)}</strong></li>
        </ul>

        {natural_recovery && (
          <>
            <h3>Natural recovery (peak → natural)</h3>
            <p className="hint">Compare against the recovery numbers above — the gap is the intervention's effect.</p>
            <ul>
              <li>SUDS drop: <strong>{signed(natural_recovery.suds_drop)}</strong></li>
              <li>HR change: <strong>{signed(natural_recovery.hr_change)} bpm</strong></li>
              <li>HRV vs baseline: <strong>{natural_recovery.hrv_recovery_pct == null ? '—' : `${natural_recovery.hrv_recovery_pct}%`}</strong></li>
              <li>EEG shift (natural − baseline): <strong>{signed(natural_recovery.eeg_shift)}</strong></li>
              <li>Vibes AI shift (natural − peak): <strong>{signed(natural_recovery.vibes_shift)}</strong></li>
              <li>Elapsed: <strong>{formatSeconds(natural_recovery.elapsed_sec)}</strong></li>
            </ul>
          </>
        )}
      </div>

      <details className="caveats">
        <summary>Honest caveats</summary>
        <ul>
          <li><strong>Decay confound.</strong> Acoustic arousal fades on its own. The control window separates app effect from natural recovery.</li>
          <li><strong>Demand effects.</strong> Participants report calmer because they expect to. SUDS is most exposed.</li>
          <li><strong>Operator bias.</strong> Manual entry by someone who knows the expected result.</li>
          <li><strong>Paced breathing inflates HRV mechanically</strong> via respiratory sinus arrhythmia — part of any HRV rise is the breathing pattern.</li>
          <li><strong>n=1, single session.</strong> A directional signal, not evidence.</li>
        </ul>
      </details>

      <div className="actions-row">
        <button type="button" className="secondary-btn" onClick={copyJson}>
          {copied ? 'Copied' : 'Copy JSON'}
        </button>
        <button type="button" className="secondary-btn" onClick={downloadJson}>
          Download JSON
        </button>
        <button type="button" className="primary-btn" onClick={onRestart}>
          New session
        </button>
      </div>

      <details className="json-preview">
        <summary>Session JSON</summary>
        <pre>{json}</pre>
      </details>
    </div>
  )
}
