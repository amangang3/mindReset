export const MEASURE_KEYS = ['hr', 'suds', 'stress', 'eeg', 'vibes']

export const MEASURE_LABELS = {
  hr: 'HR',
  suds: 'SUDS',
  stress: 'Stress',
  eeg: 'EEG',
  vibes: 'Vibes AI',
}

export const MEASURE_UNITS = {
  hr: 'bpm',
  suds: '0–10',
  stress: 'Garmin 0–100',
  eeg: 'units',
  vibes: 'score',
}

export const READING_KEYS = [
  'baseline_rest',
  'baseline_peak',
  'baseline_natural',
  'intervention_peak',
  'intervention_post',
]

export const READING_LABELS = {
  baseline_rest: 'Rest',
  baseline_peak: 'P1 Peak',
  baseline_natural: 'P1 Natural',
  intervention_peak: 'P2 Peak',
  intervention_post: 'P2 Post',
}

function emptyReading() {
  return { hr: null, suds: null, stress: null, eeg: null, vibes: null, t: null }
}

export function newSession({ participant = '', hyperventilationSeconds = 120, calmingTrack = '' } = {}) {
  return {
    session_id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `s-${Date.now().toString(36)}`,
    participant,
    timestamp: new Date().toISOString(),
    hyperventilation_seconds: hyperventilationSeconds,
    calming_track: calmingTrack,
    readings: Object.fromEntries(READING_KEYS.map((k) => [k, emptyReading()])),
  }
}

export function setReading(session, key, values, t = Date.now()) {
  return {
    ...session,
    readings: {
      ...session.readings,
      [key]: { ...session.readings[key], ...values, t },
    },
  }
}

function diff(a, b) {
  if (a == null || b == null) return null
  return Number((a - b).toFixed(2))
}

function pct(numer, denom) {
  if (numer == null || denom == null || denom === 0) return null
  return Number(((numer / denom) * 100).toFixed(1))
}

function elapsed(later, earlier) {
  if (later == null || earlier == null) return null
  return Math.round((later - earlier) / 1000)
}

function recoveryDeltas(peak, end, baseline) {
  return {
    suds_drop: diff(peak.suds, end.suds), // expect positive = improvement
    hr_change: diff(peak.hr, end.hr), // peak typically higher; positive = HR fell
    stress_drop: diff(peak.stress, end.stress), // higher score = more stress; positive = improvement
    eeg_shift: diff(end.eeg, baseline.eeg), // signed
    vibes_shift: diff(end.vibes, peak.vibes), // signed
    elapsed_sec: elapsed(end.t, peak.t),
  }
}

function gap(b, a) {
  // gap = intervention delta − natural delta. For SUDS/HR this is "extra improvement".
  if (b == null || a == null) return null
  return Number((b - a).toFixed(2))
}

export function computeDeltas(session) {
  const r = session.readings
  const natural = recoveryDeltas(r.baseline_peak, r.baseline_natural, r.baseline_rest)
  const intervention = recoveryDeltas(r.intervention_peak, r.intervention_post, r.baseline_rest)

  const beyond_natural = {
    suds_drop: gap(intervention.suds_drop, natural.suds_drop),
    hr_change: gap(intervention.hr_change, natural.hr_change),
    stress_drop: gap(intervention.stress_drop, natural.stress_drop),
    eeg_shift: gap(intervention.eeg_shift, natural.eeg_shift),
    vibes_shift: gap(intervention.vibes_shift, natural.vibes_shift),
  }

  return { natural, intervention, beyond_natural }
}

export function formatSeconds(s) {
  if (s == null) return '—'
  const m = Math.floor(s / 60)
  const ss = s % 60
  return m > 0 ? `${m}m ${ss.toString().padStart(2, '0')}s` : `${ss}s`
}
