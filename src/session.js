export const MEASURE_KEYS = ['hr', 'suds', 'hrv', 'eeg', 'vibes']

export const MEASURE_LABELS = {
  hr: 'HR',
  suds: 'SUDS',
  hrv: 'HRV',
  eeg: 'EEG',
  vibes: 'Vibes AI',
}

export const MEASURE_UNITS = {
  hr: 'bpm',
  suds: '0–10',
  hrv: 'ms',
  eeg: 'units',
  vibes: 'score',
}

const STAGE_FIELDS = ['baseline', 'peak', 'natural', 'post']

function emptyReading() {
  return { hr: null, suds: null, hrv: null, eeg: null, vibes: null, t: null }
}

export function newSession({ participant = '', hyperventilationSeconds = 45, controlWindow = true, calmingTrack = '' } = {}) {
  return {
    session_id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `s-${Date.now().toString(36)}`,
    participant,
    timestamp: new Date().toISOString(),
    hyperventilation_seconds: hyperventilationSeconds,
    calming_track: calmingTrack,
    control_window: controlWindow,
    readings: Object.fromEntries(STAGE_FIELDS.map((k) => [k, emptyReading()])),
  }
}

export function setReading(session, stage, values, t = Date.now()) {
  return {
    ...session,
    readings: {
      ...session.readings,
      [stage]: { ...session.readings[stage], ...values, t },
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

export function computeDeltas(session) {
  const { baseline, peak, natural, post } = session.readings

  const recovery = {
    suds_drop: diff(peak.suds, post.suds), // higher SUDS at peak, lower at post → positive number = improvement
    hr_change: diff(peak.hr, post.hr), // peak typically higher → positive = improvement
    hrv_recovery_pct: pct(post.hrv, baseline.hrv), // post as % of baseline
    eeg_shift: diff(post.eeg, baseline.eeg), // signed shift from baseline
    vibes_shift: diff(post.vibes, peak.vibes), // signed shift from peak
    time_to_baseline_sec:
      peak.t != null && post.t != null ? Math.round((post.t - peak.t) / 1000) : null,
  }

  const natural_recovery = session.control_window
    ? {
        suds_drop: diff(peak.suds, natural.suds),
        hr_change: diff(peak.hr, natural.hr),
        hrv_recovery_pct: pct(natural.hrv, baseline.hrv),
        eeg_shift: diff(natural.eeg, baseline.eeg),
        vibes_shift: diff(natural.vibes, peak.vibes),
        elapsed_sec:
          peak.t != null && natural.t != null
            ? Math.round((natural.t - peak.t) / 1000)
            : null,
      }
    : null

  return { recovery, natural_recovery }
}

export function formatSeconds(s) {
  if (s == null) return '—'
  const m = Math.floor(s / 60)
  const ss = s % 60
  return m > 0 ? `${m}m ${ss.toString().padStart(2, '0')}s` : `${ss}s`
}
