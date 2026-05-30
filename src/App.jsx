import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchLibrary, audioUrl } from './library.js'
import { Player } from './player.js'

const CAP_OPTIONS = [
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: 'full', value: Infinity },
]

export default function App() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cap, setCap] = useState(30)
  const [volume, setVolume] = useState(0.8)
  const [playing, setPlaying] = useState(false)
  const lastPlayedFile = useRef(null)
  const playerRef = useRef(null)

  if (!playerRef.current) playerRef.current = new Player()

  async function loadFiles() {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchLibrary()
      setFiles(list)
      if (list.length === 0) {
        setError('No audio files yet. Drop some into public/audio/ and rebuild.')
      }
    } catch (e) {
      setError(e.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  function pickRandom() {
    if (files.length === 0) return null
    if (files.length === 1) return files[0]
    let pick
    do {
      pick = files[Math.floor(Math.random() * files.length)]
    } while (pick.file === lastPlayedFile.current)
    return pick
  }

  async function handleCalm() {
    const f = pickRandom()
    if (!f) return
    lastPlayedFile.current = f.file
    setPlaying(true)
    try {
      await playerRef.current.play(audioUrl(f), cap, volume)
      if (cap !== Infinity) {
        setTimeout(() => setPlaying(false), cap * 1000)
      }
    } catch (e) {
      setError(e.message ?? String(e))
      setPlaying(false)
    }
  }

  function handleVolume(v) {
    setVolume(v)
    playerRef.current.setVolume(v)
  }

  const buttonLabel = useMemo(() => {
    if (loading) return 'Loading…'
    if (error) return 'Retry'
    return playing ? 'again' : 'calm me'
  }, [loading, error, playing])

  function onButton() {
    if (loading) return
    if (error) {
      loadFiles()
      return
    }
    handleCalm()
  }

  return (
    <div className="app">
      <button className="calm-btn" onClick={onButton} disabled={loading}>
        {buttonLabel}
      </button>

      <div className="cap-toggle" role="group" aria-label="Clip length">
        {CAP_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            className={`cap-pill ${cap === opt.value ? 'active' : ''}`}
            onClick={() => setCap(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <label className="volume">
        <span className="volume-label">volume</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => handleVolume(parseFloat(e.target.value))}
        />
      </label>

      {error && <p className="error">{error}</p>}
    </div>
  )
}
