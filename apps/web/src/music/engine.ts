/** Bandas sonoras locales: tres pistas, transición cruzada real y análisis por Web Audio. */
export const TRACK_SLOTS = [
  { key: 'menu', label: 'Menú principal', suggested: 'Natural — Imagine Dragons' },
  { key: 'waves', label: 'Oleadas 1 y 2 / Infinito', suggested: 'Hero — Skillet' },
  { key: 'boss', label: 'Tux · todas sus fases', suggested: 'Animal I Have Become — Three Days Grace' },
] as const
export type TrackKey = typeof TRACK_SLOTS[number]['key']
export type AudioPulse = { energy: number; bass: number; beat: boolean }
type Track = { url: string; file: File }
type Channel = { audio: HTMLAudioElement; gain: GainNode; source: MediaElementAudioSourceNode }
const EMPTY: AudioPulse = { energy: 0, bass: 0, beat: false }

export class MusicEngine {
  private tracks = new Map<TrackKey, Track>()
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private master: GainNode | null = null
  private channels: Channel[] = []
  private bins: Uint8Array<ArrayBuffer> | null = null
  private activeIndex = -1
  private fadeTimer: ReturnType<typeof setTimeout> | null = null
  private changeId = 0
  private smoothedBass = .08
  private lastBass = 0
  private lastBeat = -1000
  private energy = 0
  private volume = .45
  currentKey: TrackKey | null = null

  private ensureGraph() {
    if (this.context) return
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = .44
    const master = ctx.createGain()
    master.gain.value = this.volume
    analyser.connect(master)
    master.connect(ctx.destination)
    this.channels = [0, 1].map(() => {
      const audio = new Audio()
      audio.loop = true
      audio.preload = 'auto'
      const source = ctx.createMediaElementSource(audio)
      const gain = ctx.createGain()
      gain.gain.value = 0
      source.connect(gain)
      gain.connect(analyser)
      return { audio, source, gain }
    })
    this.context = ctx
    this.analyser = analyser
    this.master = master
    this.bins = new Uint8Array(analyser.frequencyBinCount)
  }

  has(key: TrackKey) { return this.tracks.has(key) }
  name(key: TrackKey) { return this.tracks.get(key)?.file.name ?? '' }
  get playing() { return this.activeIndex >= 0 && !this.channels[this.activeIndex]?.audio.paused }

  addTrack(key: TrackKey, file: File) {
    const previous = this.tracks.get(key)
    this.tracks.set(key, { url: URL.createObjectURL(file), file })
    if (previous) {
      // No revocamos la URL antigua hasta que el elemento de audio haya dejado de usarla.
      for (const channel of this.channels) {
        if (channel.audio.src === previous.url) {
          channel.audio.pause()
          channel.audio.removeAttribute('src')
          channel.audio.load()
        }
      }
      URL.revokeObjectURL(previous.url)
    }
    if (this.currentKey === key) { this.currentKey = null; this.activeIndex = -1 }
  }

  removeTrack(key: TrackKey) {
    const track = this.tracks.get(key)
    if (!track) return
    if (this.currentKey === key) this.pause()
    this.tracks.delete(key)
    for (const channel of this.channels) {
      if (channel.audio.src === track.url) {
        channel.audio.pause()
        channel.audio.removeAttribute('src')
        channel.audio.load()
      }
    }
    URL.revokeObjectURL(track.url)
    if (this.currentKey === key) { this.currentKey = null; this.activeIndex = -1 }
  }

  async play(key: TrackKey): Promise<boolean> {
    const track = this.tracks.get(key)
    if (!track) { this.pause(); this.currentKey = null; return false }
    this.ensureGraph()
    const ctx = this.context!
    if (ctx.state === 'suspended') await ctx.resume()
    const priorIndex = this.activeIndex
    const sameTrack = this.currentKey === key && priorIndex >= 0 && this.channels[priorIndex].audio.src === track.url
    if (sameTrack) {
      await this.channels[priorIndex].audio.play()
      return true
    }
    if (this.fadeTimer) { clearTimeout(this.fadeTimer); this.fadeTimer = null }
    const id = ++this.changeId
    const nextIndex = priorIndex === 0 ? 1 : 0
    const next = this.channels[nextIndex]
    const prev = priorIndex >= 0 ? this.channels[priorIndex] : null
    next.audio.pause()
    next.audio.src = track.url
    next.audio.currentTime = 0
    next.audio.load()
    const t = ctx.currentTime
    next.gain.gain.cancelScheduledValues(t)
    next.gain.gain.setValueAtTime(0, t)
    try { await next.audio.play() }
    catch (error) { next.audio.pause(); throw error }
    if (id !== this.changeId) { next.audio.pause(); return false }
    const now = ctx.currentTime
    const seconds = prev && !prev.audio.paused ? 1.8 : .75
    next.gain.gain.setValueAtTime(0, now)
    next.gain.gain.linearRampToValueAtTime(1, now + seconds)
    if (prev) {
      prev.gain.gain.cancelScheduledValues(now)
      prev.gain.gain.setValueAtTime(prev.gain.gain.value, now)
      prev.gain.gain.linearRampToValueAtTime(0, now + seconds)
      this.fadeTimer = setTimeout(() => { if (id === this.changeId) { prev.audio.pause(); prev.audio.removeAttribute('src'); prev.audio.load() } }, seconds * 1000 + 80)
    }
    this.activeIndex = nextIndex
    this.currentKey = key
    this.lastBass = 0
    this.smoothedBass = .08
    return true
  }

  pause() {
    ++this.changeId
    if (this.fadeTimer) { clearTimeout(this.fadeTimer); this.fadeTimer = null }
    this.channels.forEach((channel, index) => {
      channel.audio.pause()
      if (this.context) {
        const t = this.context.currentTime
        channel.gain.gain.cancelScheduledValues(t)
        channel.gain.gain.setValueAtTime(index === this.activeIndex ? 1 : 0, t)
      }
    })
    this.energy = 0
  }
  async resume(): Promise<boolean> {
    if (!this.currentKey) return false
    return this.play(this.currentKey)
  }
  setVolume(level: number) {
    this.volume = Math.min(1, Math.max(0, level))
    if (this.master && this.context) this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, .05)
  }

  /** Los graves activan colores y golpes con límite de eventos; no se lee ningún dato externo. */
  sample(sensitivity: number, nowSeconds: number): AudioPulse {
    if (!this.analyser || !this.bins || !this.playing || this.context?.state !== 'running') {
      this.energy *= .88
      return { ...EMPTY, energy: this.energy }
    }
    this.analyser.getByteFrequencyData(this.bins)
    let bass = 0
    let broad = 0
    for (let i = 3; i < 15; i++) bass += this.bins[i] / 255
    bass /= 12
    for (let i = 3; i < 110; i++) broad += this.bins[i] / 255
    broad /= 107
    this.energy = this.energy * .64 + (bass * .72 + broad * .28) * .36
    const baseline = this.smoothedBass
    this.smoothedBass = this.smoothedBass * .963 + bass * .037
    const rise = bass - this.lastBass
    this.lastBass = bass
    const beat = bass > Math.max(.105 / sensitivity, baseline * 1.12 / sensitivity)
      && rise > .016 / sensitivity && nowSeconds - this.lastBeat > .29
    if (beat) this.lastBeat = nowSeconds
    return { energy: Math.min(1, this.energy * 2.0), bass, beat }
  }

  dispose() {
    this.pause()
    for (const ch of this.channels) { ch.audio.removeAttribute('src'); ch.audio.load() }
    for (const track of this.tracks.values()) URL.revokeObjectURL(track.url)
    this.tracks.clear()
    void this.context?.close().catch(() => {})
    this.context = null
    this.channels = []
  }
}
