const FADE_OUT_SEC = 2
const STOP_FADE_SEC = 0.2

export class Player {
  constructor() {
    this.ctx = null
    this.gain = null
    this.source = null
    this.audio = null
    this.timers = []
  }

  _ensureGraph() {
    if (this.ctx) return
    const Ctx = window.AudioContext || window.webkitAudioContext
    this.ctx = new Ctx()
    this.audio = new Audio()
    this.audio.crossOrigin = 'anonymous'
    this.audio.preload = 'auto'
    this.source = this.ctx.createMediaElementSource(this.audio)
    this.gain = this.ctx.createGain()
    this.source.connect(this.gain).connect(this.ctx.destination)
  }

  _clearTimers() {
    for (const t of this.timers) clearTimeout(t)
    this.timers = []
  }

  async play(url, capSeconds, volume) {
    this._ensureGraph()
    this._clearTimers()

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }

    this.audio.pause()
    this.audio.src = url
    this.audio.currentTime = 0

    const now = this.ctx.currentTime
    this.gain.gain.cancelScheduledValues(now)
    this.gain.gain.setValueAtTime(volume, now)

    await this.audio.play()

    if (capSeconds !== Infinity && Number.isFinite(capSeconds)) {
      const fadeStartMs = Math.max(0, (capSeconds - FADE_OUT_SEC) * 1000)
      const stopMs = capSeconds * 1000
      const audioRef = this.audio

      this.timers.push(setTimeout(() => {
        const t = this.ctx.currentTime
        this.gain.gain.cancelScheduledValues(t)
        this.gain.gain.setValueAtTime(this.gain.gain.value, t)
        this.gain.gain.linearRampToValueAtTime(0, t + FADE_OUT_SEC)
      }, fadeStartMs))

      this.timers.push(setTimeout(() => {
        audioRef.pause()
      }, stopMs))
    }
  }

  setVolume(volume) {
    if (!this.gain) return
    const t = this.ctx.currentTime
    this.gain.gain.cancelScheduledValues(t)
    this.gain.gain.setValueAtTime(volume, t)
  }

  async stop() {
    this._clearTimers()
    if (!this.ctx || !this.audio) return
    const t = this.ctx.currentTime
    this.gain.gain.cancelScheduledValues(t)
    this.gain.gain.setValueAtTime(this.gain.gain.value, t)
    this.gain.gain.linearRampToValueAtTime(0, t + STOP_FADE_SEC)
    await new Promise((r) => setTimeout(r, STOP_FADE_SEC * 1000))
    this.audio.pause()
  }
}
