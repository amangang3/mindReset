import { useEffect, useRef, useState } from 'react'

export default function CountdownStage({
  title,
  instructions,
  durationSec,
  ctaWhileRunning = 'Stop early',
  ctaWhenDone = 'Record now',
  onStart,
  onStop,
  onComplete,
  autoStart = false,
}) {
  const [running, setRunning] = useState(autoStart)
  const [remaining, setRemaining] = useState(durationSec)
  const startedAtRef = useRef(null)

  useEffect(() => {
    if (!running) return
    if (startedAtRef.current == null) {
      startedAtRef.current = Date.now()
      onStart?.()
    }
    const tick = () => {
      const elapsed = (Date.now() - startedAtRef.current) / 1000
      const left = Math.max(0, durationSec - elapsed)
      setRemaining(left)
      if (left <= 0) {
        setRunning(false)
        onComplete?.()
      }
    }
    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [running, durationSec, onStart, onComplete])

  function handleStart() {
    startedAtRef.current = null
    setRunning(true)
  }

  function handleStop() {
    setRunning(false)
    onStop?.()
  }

  const minutes = Math.floor(remaining / 60)
  const seconds = Math.floor(remaining % 60)
  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`
  const progress = 1 - remaining / durationSec

  return (
    <div className="stage stage-countdown">
      <h2>{title}</h2>
      {instructions && <p className="hint">{instructions}</p>}

      <div className="countdown-ring" style={{ '--progress': progress }}>
        <span className="countdown-value">{display}</span>
      </div>

      {!running && remaining > 0 && remaining === durationSec && (
        <button type="button" className="primary-btn" onClick={handleStart}>
          Start
        </button>
      )}

      {running && (
        <button type="button" className="secondary-btn" onClick={handleStop}>
          {ctaWhileRunning}
        </button>
      )}

      {!running && remaining < durationSec && (
        <button type="button" className="primary-btn" onClick={() => onComplete?.()}>
          {ctaWhenDone}
        </button>
      )}
    </div>
  )
}
