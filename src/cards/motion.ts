// Device tilt shared by every holo card. Values are -1..1, with the phone's starting angle as neutral.
export const tilt = { x: 0, y: 0, active: false }
let started = false, baseBeta: number | null = null

function onOrientation(event: DeviceOrientationEvent) {
  if (event.gamma == null || event.beta == null) return
  baseBeta ??= event.beta
  tilt.x = Math.max(-1, Math.min(1, event.gamma / 25))
  tilt.y = Math.max(-1, Math.min(1, (event.beta - baseBeta) / 25))
  tilt.active = true
}

// iOS only allows asking for motion access from a tap, so call this from a pointer or click handler.
export function enableMotion() {
  if (started || typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return
  if (!window.matchMedia('(pointer: coarse)').matches) return
  started = true
  const request = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission
  if (request) request().then(state => { if (state === 'granted') window.addEventListener('deviceorientation', onOrientation) }).catch(() => { started = false })
  else window.addEventListener('deviceorientation', onOrientation)
}

export function disableMotion() {
  window.removeEventListener('deviceorientation', onOrientation)
  started = false; baseBeta = null; tilt.active = false
}
