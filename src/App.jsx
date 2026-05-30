import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchLibrary, audioUrl } from './library.js'
import { Player } from './player.js'
import { newSession, setReading } from './session.js'
import StageIndicator from './components/StageIndicator.jsx'
import SetupStage from './components/SetupStage.jsx'
import MeasurementStage from './components/MeasurementStage.jsx'
import CountdownStage from './components/CountdownStage.jsx'
import ResultsStage from './components/ResultsStage.jsx'

const ACTIVE_CATEGORY = 'calm'
const NATURAL_RECOVERY_SEC = 30
const INTERVENTION_SEC = 30

// Stage keys map to a phase + a sub-step. Phase indicator pulls from this.
const STAGES = {
  setup: { phase: null, sub: null },
  p1_rest: { phase: 1, sub: 'Rest' },
  p1_induce: { phase: 1, sub: 'Hyperventilate' },
  p1_peak: { phase: 1, sub: 'Peak' },
  p1_natural_wait: { phase: 1, sub: 'Natural recovery' },
  p1_natural: { phase: 1, sub: 'Recovered' },
  p2_induce: { phase: 2, sub: 'Hyperventilate' },
  p2_peak: { phase: 2, sub: 'Peak' },
  p2_intervention: { phase: 2, sub: 'Intervention' },
  p2_post: { phase: 2, sub: 'Post' },
  results: { phase: null, sub: null },
}

const PHASES = [
  { key: 1, label: '1. Baseline' },
  { key: 2, label: '2. Intervention' },
]

export default function App() {
  const [tracks, setTracks] = useState([])
  const [libraryError, setLibraryError] = useState(null)
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [stage, setStage] = useState('setup')
  const playerRef = useRef(null)
  if (!playerRef.current) playerRef.current = new Player()

  useEffect(() => {
    let cancelled = false
    fetchLibrary()
      .then((all) => {
        if (cancelled) return
        const filtered = all.filter((f) => f.category === ACTIVE_CATEGORY)
        setTracks(filtered)
        if (filtered.length === 0) {
          setLibraryError(`No tracks in public/audio/${ACTIVE_CATEGORY}/. Add at least one and rebuild.`)
        }
      })
      .catch((e) => {
        if (cancelled) return
        setLibraryError(e.message ?? String(e))
      })
      .finally(() => !cancelled && setLibraryLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  function handleStart(config) {
    setSession(newSession(config))
    setStage('p1_rest')
  }

  function record(key, values, nextStage) {
    setSession((prev) => setReading(prev, key, values))
    setStage(nextStage)
  }

  function handleRestart() {
    playerRef.current.stop().catch(() => {})
    setSession(null)
    setStage('setup')
  }

  async function startIntervention() {
    const track = tracks.find((t) => t.file === session.calming_track) ?? tracks[0]
    if (!track) return
    try {
      await playerRef.current.play(audioUrl(track), INTERVENTION_SEC, 0.8)
    } catch (e) {
      console.error('playback failed', e)
    }
  }

  function stopIntervention() {
    playerRef.current.stop().catch(() => {})
  }

  const phaseMeta = STAGES[stage]
  const indicator = session && phaseMeta.phase != null && (
    <StageIndicator phases={PHASES} currentPhase={phaseMeta.phase} subLabel={phaseMeta.sub} />
  )

  let screen
  if (libraryLoading) {
    screen = <div className="stage stage-loading"><p>Loading…</p></div>
  } else if (stage === 'setup') {
    screen = <SetupStage tracks={tracks} onStart={handleStart} />
  } else if (stage === 'p1_rest') {
    screen = (
      <MeasurementStage
        title="Phase 1 · Rest baseline"
        hint="Sit still 60–90s, normal breathing. Then record."
        onSubmit={(v) => record('baseline_rest', v, 'p1_induce')}
      />
    )
  } else if (stage === 'p1_induce') {
    screen = (
      <CountdownStage
        title="Phase 1 · Hyperventilate"
        instructions="Fast, deep breathing while seated. Stop early if dizzy."
        durationSec={session.hyperventilation_seconds}
        ctaWhileRunning="Stop early"
        ctaWhenDone="Record peak"
        onComplete={() => setStage('p1_peak')}
      />
    )
  } else if (stage === 'p1_peak') {
    screen = (
      <MeasurementStage
        title="Phase 1 · Peak"
        hint="Immediately after the breathing stops."
        onSubmit={(v) => record('baseline_peak', v, 'p1_natural_wait')}
      />
    )
  } else if (stage === 'p1_natural_wait') {
    screen = (
      <CountdownStage
        title="Phase 1 · Natural recovery"
        instructions="30s of quiet normal breathing. No intervention — this is the control."
        durationSec={NATURAL_RECOVERY_SEC}
        ctaWhileRunning="Skip"
        ctaWhenDone="Record"
        onComplete={() => setStage('p1_natural')}
      />
    )
  } else if (stage === 'p1_natural') {
    screen = (
      <MeasurementStage
        title="Phase 1 · After natural recovery"
        hint="How far they came back on their own."
        ctaLabel="Start Phase 2"
        onSubmit={(v) => record('baseline_natural', v, 'p2_induce')}
      />
    )
  } else if (stage === 'p2_induce') {
    screen = (
      <CountdownStage
        title="Phase 2 · Hyperventilate"
        instructions="Same protocol as Phase 1. Stop early if dizzy."
        durationSec={session.hyperventilation_seconds}
        ctaWhileRunning="Stop early"
        ctaWhenDone="Record peak"
        onComplete={() => setStage('p2_peak')}
      />
    )
  } else if (stage === 'p2_peak') {
    screen = (
      <MeasurementStage
        title="Phase 2 · Peak"
        hint="Immediately after the breathing stops."
        onSubmit={(v) => record('intervention_peak', v, 'p2_intervention')}
      />
    )
  } else if (stage === 'p2_intervention') {
    screen = (
      <CountdownStage
        title="Phase 2 · Intervention"
        instructions="Calming track + paced breathing. Stop early when ready."
        durationSec={INTERVENTION_SEC}
        ctaWhileRunning="Stop & record"
        ctaWhenDone="Record post"
        onStart={startIntervention}
        onStop={() => {
          stopIntervention()
          setStage('p2_post')
        }}
        onComplete={() => {
          stopIntervention()
          setStage('p2_post')
        }}
      />
    )
  } else if (stage === 'p2_post') {
    screen = (
      <MeasurementStage
        title="Phase 2 · Post-intervention"
        hint="The recovery snapshot. Compare against Phase 1 natural."
        ctaLabel="See results"
        onSubmit={(v) => record('intervention_post', v, 'results')}
      />
    )
  } else if (stage === 'results') {
    screen = <ResultsStage session={session} onRestart={handleRestart} />
  }

  return (
    <div className="app">
      {indicator}
      {libraryError && <p className="error">{libraryError}</p>}
      {screen}
    </div>
  )
}
