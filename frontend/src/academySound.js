const PREFERENCE = 'wanxiang-academy-operation-sound-v1'
let fallbackEnabled = true
let engine
let output
let impactNoise
const lastSound = new Map()

export function academySoundEnabled() {
  try {
    return window.localStorage.getItem(PREFERENCE) !== 'off'
  } catch {
    return fallbackEnabled
  }
}

export function setAcademySoundEnabled(enabled) {
  fallbackEnabled = enabled
  try { window.localStorage.setItem(PREFERENCE, enabled ? 'on' : 'off') } catch {}
  if (output) output.gain.value = enabled ? 1 : 0
}

function resonantPulse(start, frequency, level, decay) {
  const tone = engine.createOscillator()
  const envelope = engine.createGain()
  tone.frequency.value = frequency
  envelope.gain.setValueAtTime(0.0001, start)
  envelope.gain.linearRampToValueAtTime(level, start + 0.003)
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + decay)
  tone.connect(envelope)
  envelope.connect(output)
  tone.start(start)
  tone.stop(start + decay + 0.01)
}

function impact(start, frequency, bandwidth, level, decay) {
  if (!impactNoise) {
    impactNoise = engine.createBuffer(1, Math.ceil(engine.sampleRate * 0.06), engine.sampleRate)
    const samples = impactNoise.getChannelData(0)
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
  }
  const noise = engine.createBufferSource()
  noise.buffer = impactNoise
  const filter = engine.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = frequency
  filter.Q.value = bandwidth
  const envelope = engine.createGain()
  envelope.gain.setValueAtTime(level, start)
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + decay)
  noise.connect(filter)
  filter.connect(envelope)
  envelope.connect(output)
  noise.start(start)
  noise.stop(start + decay)
}

function copperClink(start, strength) {
  const pitch = 0.87 + Math.random() * 0.25
  impact(start, 2600 * pitch, 0.8, 0.08 * strength, 0.022)
  resonantPulse(start, 1781 * pitch, 0.034 * strength, 0.094)
  resonantPulse(start, 2797 * pitch, 0.023 * strength, 0.067)
  resonantPulse(start, 4111 * pitch, 0.013 * strength, 0.047)
}

const sounds = {
  tap(start) {
    impact(start, 540, 0.9, 0.095, 0.028)
    resonantPulse(start, 291, 0.065, 0.052)
    resonantPulse(start, 657, 0.024, 0.025)
  },
  coinTouch(start) {
    copperClink(start, 0.64)
  },
  coins(start) {
    const collisions = [[0, 0.84], [0.044, 0.68], [0.094, 1], [0.157, 0.72], [0.263, 0.78], [0.406, 0.56]]
    collisions.forEach(([offset, strength]) => copperClink(start + offset + Math.random() * 0.014, strength))
  },
  success(start) {
    impact(start, 1450, 2, 0.045, 0.019)
    resonantPulse(start, 523.25, 0.071, 0.29)
    resonantPulse(start, 1256, 0.018, 0.16)
    resonantPulse(start + 0.064, 783.99, 0.06, 0.34)
    resonantPulse(start + 0.064, 1881, 0.013, 0.13)
  },
}

export function playAcademySound(kind) {
  if (!academySoundEnabled() || typeof window === 'undefined' || !Object.hasOwn(sounds, kind)) return
  const AudioEngine = window.AudioContext || window.webkitAudioContext
  if (!AudioEngine) return
  try {
    if (!engine || engine.state === 'closed') {
      engine = new AudioEngine()
      output = engine.createGain()
      output.connect(engine.destination)
      impactNoise = undefined
      lastSound.clear()
    }
    if (engine.state === 'suspended' || engine.state === 'interrupted') void engine.resume().catch(()=>{})
    output.gain.value = 1
    const now = engine.currentTime
    if (now - (lastSound.get(kind) ?? -1) < 0.045) return
    lastSound.set(kind, now)
    sounds[kind](now + 0.008)
  } catch {
    // Unsupported or restricted audio must never interrupt an action.
  }
}

export function listenForAcademySounds() {
  function playAction(event) {
    if (!event.isTrusted) return
    const control = event.target.closest?.('button, summary, select, [data-academy-sound]')
    if (!control || control.disabled || control.getAttribute('aria-disabled') === 'true') return
    if (control.matches('select') !== (event.type === 'change')) return
    const sound = control.dataset.academySound ?? 'tap'
    if (sound !== 'silent') playAcademySound(sound)
  }
  document.addEventListener('click', playAction, true)
  document.addEventListener('change', playAction, true)
  return () => {
    document.removeEventListener('click', playAction, true)
    document.removeEventListener('change', playAction, true)
  }
}
