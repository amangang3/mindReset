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
const CONTROL_WINDOW_SEC = 30
const INTERVENTION_SEC = 4 * 60 // 4 min

const STAGE_ORDER_BASE = [
  { key: 'setup', label: 'Setup' },
  { key: 'baseline', label: 'Baseline' },
  { key: 'induce', label: 'Induce' },
  { key: 'peak', label: 'Peak' },
  { key: 'natural', label: 'Natural' },
  { key: 'intervention', label: 'Intervention' },
  { key: 'post', label: 'Post' },
  { key: 'results', label: 'Results' },
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

  const stages = useMemo(
    () => STAGE_ORDER_BASE.filter((s) => s.key !== 'natural' || session?.control_window),
    [session]
  )
  const currentIndex = stages.findIndex((s) => s.key === stage)

  function handleStart(config) {
    const s = newSession(config)
    setSession(s)
    setStage('baseline')
  }

  function recordReading(stageKey, values) {
    setSession((prev) => setReading(prev, stageKey, values))
  }

  function handleRestart() {
    playerRef.current.stop().catch(() => {})
    setSession(null)
    setStage('setup')
  }

  // ----- intervention playback -----

  async function startIntervention() {
    const track = tracks.find((t) => t.file === session.calming_track) ?? tracks[0]
    if (!track) return
    try {
      await playerRef.current.play(audioUrl(track), Infinity, 0.8)
    } catch (e) {
      console.error('playback failed', e)
    }
  }

  function stopIntervention() {
    playerRef.current.stop().catch(() => {})
  }

  // ----- screen routing -----

  let screen
  if (libraryLoading) {
    screen = <div className="stage stage-loading"><p>Loading…</p></div>
  } else if (stage === 'setup') {
    screen = <SetupStage tracks={tracks} onStart={handleStart} />
  } else if (stage === 'baseline') {
    screen = (
      <MeasurementStage
        title="Baseline"
        hint="Sit still 60–90s, normal breathing. Then record."
        onSubmit={(v) => {
          recordReading('baseline', v)
          setStage('induce')
        }}
      />
    )
  } else if (stage === 'induce') {
    screen = (
      <CountdownStage
        title="Hyperventilate"
        instructions="Fast, deep breathing while seated. Stop early if dizzy."
        durationSec={session.hyperventilation_seconds}
        ctaWhileRunning="Stop early"
        ctaWhenDone="Record peak"
        onComplete={() => setStage('peak')}
      />
    )
  } else if (stage === 'peak') {
    screen = (
      <MeasurementStage
        title="Peak"
        hint="Immediately after the breathing stops. Arousal decays fast."
        onSubmit={(v) => {
          recordReading('peak', v)
          setStage(session.control_window ? 'natural-wait' : 'intervention-wait')
        }}
      />
    )
  } else if (stage === 'natural-wait') {
    screen = (
      <CountdownStage
        title="Natural recovery"
        instructions="30s of quiet normal breathing — no intervention. Then record."
        durationSec={CONTROL_WINDOW_SEC}
        ctaWhileRunning="Skip"
        ctaWhenDone="Record natural"
        onComplete={() => setStage('natural')}
      />
    )
  } else if (stage === 'natural') {
    screen = (
      <MeasurementStage
        title="Natural"
        hint="Recovery without intervention."
        onSubmit={(v) => {
          recordReading('natural', v)
          setStage('intervention-wait')
        }}
      />
    )
  } else if (stage === 'intervention-wait') {
    screen = (
      <CountdownStage
        title="Intervention"
        instructions="Calming track + paced breathing. Stop early when ready."
        durationSec={INTERVENTION_SEC}
        ctaWhileRunning="Stop & record"
        ctaWhenDone="Record post"
        onStart={startIntervention}
        onStop={() => {
          stopIntervention()
          setStage('post')
        }}
        onComplete={() => {
          stopIntervention()
          setStage('post')
        }}
      />
    )
  } else if (stage === 'post') {
    screen = (
      <MeasurementStage
        title="Post"
        hint="After the intervention. This is the recovery snapshot."
        ctaLabel="See results"
        onSubmit={(v) => {
          recordReading('post', v)
          setStage('results')
        }}
      />
    )
  } else if (stage === 'results') {
    screen = <ResultsStage session={session} onRestart={handleRestart} />
  }

  // map intermediate keys back to the visible stage for the indicator
  const indicatorStageKey = stage.replace('-wait', '')
  const indicatorIndex = stages.findIndex((s) => s.key === indicatorStageKey)

  return (
    <div className="app">
      {session && (
        <StageIndicator
          stages={stages}
          currentIndex={indicatorIndex >= 0 ? indicatorIndex : currentIndex}
        />
      )}
      {libraryError && <p className="error">{libraryError}</p>}
      {screen}
    </div>
  )
}
