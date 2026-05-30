import { useMemo, useState } from 'react'
import {
  MEASURE_KEYS,
  MEASURE_LABELS,
  READING_KEYS,
  READING_LABELS,
  computeDeltas,
  formatSeconds,
} from '../session.js'

function val(v) {
  return v == null ? '—' : v
}

function signed(v, suffix = '') {
  if (v == null) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${v}${suffix}`
}

export default function ResultsStage({ session, onRestart }) {
  const { natural, intervention, beyond_natural } = useMemo(() => computeDeltas(session), [session])
  const [copied, setCopied] = useState(false)
  const json = useMemo(() => JSON.stringify(session, null, 2), [session])

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
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
        <strong>{session.participant}</strong> · Hyperventilation:{' '}
        <strong>{session.hyperventilation_seconds}s</strong>
      </p>

      <div className="results-table-wrap">
        <table className="results-table">
          <thead>
            <tr>
              <th></th>
              {READING_KEYS.map((k) => (
                <th key={k}>{READING_LABELS[k]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEASURE_KEYS.map((k) => (
              <tr key={k}>
                <th>{MEASURE_LABELS[k]}</th>
                {READING_KEYS.map((rk) => (
                  <td key={rk}>{val(session.readings[rk][k])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="deltas">
        <h3>Phase 1 — natural recovery (peak → natural)</h3>
        <ul>
          <li>SUDS drop: <strong>{signed(natural.suds_drop)}</strong></li>
          <li>HR change: <strong>{signed(natural.hr_change, ' bpm')}</strong></li>
          <li>HRV vs rest: <strong>{natural.hrv_recovery_pct == null ? '—' : `${natural.hrv_recovery_pct}%`}</strong></li>
          <li>EEG shift (natural − rest): <strong>{signed(natural.eeg_shift)}</strong></li>
          <li>Vibes AI shift (natural − peak): <strong>{signed(natural.vibes_shift)}</strong></li>
          <li>Elapsed: <strong>{formatSeconds(natural.elapsed_sec)}</strong></li>
        </ul>

        <h3>Phase 2 — intervention recovery (peak → post)</h3>
        <ul>
          <li>SUDS drop: <strong>{signed(intervention.suds_drop)}</strong></li>
          <li>HR change: <strong>{signed(intervention.hr_change, ' bpm')}</strong></li>
          <li>HRV vs rest: <strong>{intervention.hrv_recovery_pct == null ? '—' : `${intervention.hrv_recovery_pct}%`}</strong></li>
          <li>EEG shift (post − rest): <strong>{signed(intervention.eeg_shift)}</strong></li>
          <li>Vibes AI shift (post − peak): <strong>{signed(intervention.vibes_shift)}</strong></li>
          <li>Elapsed: <strong>{formatSeconds(intervention.elapsed_sec)}</strong></li>
        </ul>

        <h3>Intervention beyond natural (P2 − P1)</h3>
        <p className="hint">Extra recovery the intervention bought on top of doing nothing. Compare elapsed times above — intervention typically takes longer by design.</p>
        <ul>
          <li>SUDS drop gap: <strong>{signed(beyond_natural.suds_drop)}</strong></li>
          <li>HR change gap: <strong>{signed(beyond_natural.hr_change, ' bpm')}</strong></li>
          <li>HRV gap: <strong>{beyond_natural.hrv_recovery_pct == null ? '—' : `${signed(beyond_natural.hrv_recovery_pct)}pp`}</strong></li>
          <li>EEG shift gap: <strong>{signed(beyond_natural.eeg_shift)}</strong></li>
          <li>Vibes AI shift gap: <strong>{signed(beyond_natural.vibes_shift)}</strong></li>
        </ul>
      </div>

      <details className="caveats">
        <summary>Honest caveats</summary>
        <ul>
          <li><strong>Order effect.</strong> Phase 1 always runs before Phase 2 in this build, so any improvement could be participant warming up or learning. A real study would counterbalance order.</li>
          <li><strong>Carryover.</strong> Phase 2 starts soon after Phase 1's natural recovery. The "rest baseline" for Phase 2's peak is implicitly Phase 1's natural — not a fresh resting state.</li>
          <li><strong>Demand effects.</strong> Participants expect the intervention to work; SUDS is most exposed.</li>
          <li><strong>Operator bias.</strong> Manual entry by someone who knows the expected result.</li>
          <li><strong>Paced breathing inflates HRV mechanically</strong> via respiratory sinus arrhythmia.</li>
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
