import { useState } from 'react'
import { MEASURE_LABELS, MEASURE_UNITS } from '../session.js'

const SUDS_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const NUMERIC_FIELDS = ['hr', 'stress', 'eeg', 'vibes']

export default function MeasurementStage({ title, hint, ctaLabel = 'Continue', onSubmit }) {
  const [values, setValues] = useState({ hr: '', suds: null, stress: '', eeg: '', vibes: '' })

  function setField(k, v) {
    setValues((s) => ({ ...s, [k]: v }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const out = {
      hr: values.hr === '' ? null : Number(values.hr),
      suds: values.suds,
      stress: values.stress === '' ? null : Number(values.stress),
      eeg: values.eeg === '' ? null : Number(values.eeg),
      vibes: values.vibes === '' ? null : Number(values.vibes),
    }
    onSubmit(out)
  }

  return (
    <form className="stage stage-measurement" onSubmit={handleSubmit}>
      <h2>{title}</h2>
      {hint && <p className="hint">{hint}</p>}

      <div className="measure-grid">
        {NUMERIC_FIELDS.map((k) => (
          <label key={k} className="measure">
            <span className="measure-label">
              {MEASURE_LABELS[k]} <span className="measure-unit">{MEASURE_UNITS[k]}</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={values[k]}
              onChange={(e) => setField(k, e.target.value)}
              placeholder="—"
            />
          </label>
        ))}
      </div>

      <div className="suds">
        <span className="measure-label">
          {MEASURE_LABELS.suds} <span className="measure-unit">{MEASURE_UNITS.suds}</span>
        </span>
        <div className="suds-row" role="radiogroup" aria-label="SUDS">
          {SUDS_VALUES.map((n) => (
            <button
              type="button"
              key={n}
              role="radio"
              aria-checked={values.suds === n}
              className={`suds-pill ${values.suds === n ? 'active' : ''}`}
              onClick={() => setField('suds', n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className="primary-btn">
        {ctaLabel}
      </button>
    </form>
  )
}
