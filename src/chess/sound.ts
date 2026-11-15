let ctx: AudioContext | null = null
let muted = false

export function setMuted(value: boolean) {
  muted = value
}

export function unlockAudio() {
  if (typeof window === "undefined" || muted) return
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return
  if (!ctx) ctx = new Ctx()
  if (ctx.state === "suspended") void ctx.resume()
}

export function playMoveSound(san: string, gameOver: boolean) {
  if (typeof window === "undefined" || muted || !ctx || !san) return
  if (gameOver) {
    tone(392, 0.12, "sine", 0.05)
    window.setTimeout(() => tone(330, 0.18, "sine", 0.045), 110)
    return
  }
  if (san.includes("#") || san.includes("+")) {
    tone(620, 0.07, "triangle", 0.04)
    window.setTimeout(() => tone(784, 0.09, "triangle", 0.035), 80)
    return
  }
  if (san.includes("x")) {
    tone(180, 0.09, "triangle", 0.05)
    return
  }
  tone(520, 0.045, "sine", 0.03)
}

function tone(freq: number, dur: number, type: OscillatorType, volume: number) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + dur)
}
