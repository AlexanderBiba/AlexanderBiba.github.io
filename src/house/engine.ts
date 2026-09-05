import * as THREE from 'three'
import { buildWorld, disposeMaterials, person, type World } from './world'
import { findPath, walkable, interactionDistance, canInteract, interactionPath, isMovementKey, type Point } from './navigation'
import type { RoomId } from './content'

export type Engine = {
  setRoom: (room: RoomId) => void
  setPaused: (paused: boolean) => void
  setSound: (enabled: boolean) => void
  interact: () => void
  visit: (id: string) => void
  zoom: (delta: number) => void
  dispose: () => void
}
export function createEngine(container: HTMLElement, callbacks: { interact: (id: string) => void; nearby: (id: string | null) => void; hover: (id: string | null, x: number, y: number) => void; error: () => void }): Engine {
  const scene = new THREE.Scene()
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' })
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05
  renderer.domElement.setAttribute('aria-label', 'Alex’s house. Use arrow keys to walk, E to interact, or click an object.'); renderer.domElement.tabIndex = 0
  container.appendChild(renderer.domElement)
  const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, .1, 100)
  camera.position.set(16, 16, 16); camera.lookAt(0, .6, 0)
  scene.add(new THREE.HemisphereLight('#fff9e9', '#94ad8c', 2.1))
  const sun = new THREE.DirectionalLight('#fff1cc', 2.6); sun.position.set(-3, 12, 7); sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: .1, far: 40 }); sun.shadow.normalBias = .035; sun.shadow.bias = -.00015; scene.add(sun)
  const fill = new THREE.DirectionalLight('#d6ebef', 1.2); fill.position.set(7, 4, -5); scene.add(fill)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: '#536250', opacity: .12 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -.63; ground.receiveShadow = true; scene.add(ground)
  const worlds = new Map<RoomId, World>(); let current = 'upstairs' as RoomId, world: World
  const avatar = person(scene, 0, 0)
  const ring = new THREE.Mesh(new THREE.RingGeometry(.33, .4, 32), new THREE.MeshBasicMaterial({ color: '#fff4cc', transparent: true, opacity: .8, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .045; scene.add(ring)
  const destination = new THREE.Mesh(new THREE.RingGeometry(.12, .19, 24), new THREE.MeshBasicMaterial({ color: '#fff0b3', transparent: true, opacity: .8, side: THREE.DoubleSide })); destination.rotation.x = -Math.PI / 2; destination.position.y = .06; destination.visible = false; scene.add(destination)
  let path: Point[] = [], pending: string | null = null, nearest: string | null = null, paused = false, disposed = false, sound = false, zoom = 1, walkTime = 0, lastStep = 0, lastRepath = 0
  let audio: AudioContext | null = null
  const keys = new Set<string>(), reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3()
  function chime(notes = [523.25, 659.25, 783.99]) {
    if (!sound) return
    try {
      audio ||= new AudioContext(); void audio.resume()
      notes.forEach((frequency, i) => { const oscillator = audio!.createOscillator(), gain = audio!.createGain(), time = audio!.currentTime + i * .08; oscillator.type = 'triangle'; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(.045, time + .012); gain.gain.exponentialRampToValueAtTime(.001, time + .23); oscillator.connect(gain); gain.connect(audio!.destination); oscillator.start(time); oscillator.stop(time + .25) })
    } catch { /* Audio is optional; exploration remains available. */ }
  }
  function setRoom(room: RoomId) {
    const previousRoom = world ? current : null
    if (world) scene.remove(world.root)
    current = room
    if (!worlds.has(room)) worlds.set(room, buildWorld(room))
    world = worlds.get(room)!; scene.add(world.root)
    const entry = room === 'downstairs' && previousRoom === 'backyard' ? { x: -1.7, z: -3.75 }
      : (room === 'upstairs' && previousRoom === 'downstairs') || (room === 'downstairs' && previousRoom === 'upstairs') ? { x: 4.15, z: 2.05 }
      : world.spawn
    avatar.group.position.set(entry.x, 0, entry.z)
    avatar.group.rotation.y = entry.z > 1.5 ? Math.PI : 0
    camera.lookAt(0, room === 'backyard' ? 1.2 : .6, 0)
    resize()
    path = []; pending = null; nearest = null; keys.clear(); destination.visible = false; callbacks.nearby(null); callbacks.hover(null, 0, 0)
    chime()
  }
  function resize() {
    const width = container.clientWidth, height = container.clientHeight
    if (!width || !height) return
    const aspect = width / height, span = Math.max(current === 'backyard' ? 13.1 : 11.7, 17.6 / aspect) / zoom
    camera.left = -span * aspect / 2; camera.right = span * aspect / 2; camera.top = span / 2; camera.bottom = -span / 2; camera.updateProjectionMatrix(); renderer.setPixelRatio(Math.min(1, 760 / width)); renderer.setSize(width, height)
  }
  const observer = new ResizeObserver(resize); observer.observe(container)
  function hotspotAt(event: MouseEvent) {
    const rect = renderer.domElement.getBoundingClientRect(); mouse.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1); ray.setFromCamera(mouse, camera)
    const intersections = ray.intersectObjects([...world.hotspots.map(h => h.group), ...world.hotspots.map(h => h.marker)], true)
    for (const item of intersections) { let object: THREE.Object3D | null = item.object; while (object) { if (object.userData.hotspot) return object.userData.hotspot as string; object = object.parent } }
    return null
  }
  function visit(id: string) {
    const target = world.hotspots.find(h => h.id === id)
    if (!target) return
    const p = avatar.group.position
    if (canInteract(p, target)) { activate(id); return }
    path = interactionPath(p, target, world.obstacles)
    if (path.length) { pending = id; destination.visible = true; destination.position.set(path[path.length - 1].x, .06, path[path.length - 1].z) }
  }
  function activate(id: string) { if (paused) return; paused = true; keys.clear(); path = []; pending = null; destination.visible = false; chime(id === 'guitar' ? [196, 246.94, 293.66, 392] : undefined); callbacks.interact(id) }
  function sceneClick(event: MouseEvent) {
    if (paused || event.button !== 0) return
    renderer.domElement.focus({ preventScroll: true }); const id = hotspotAt(event)
    if (id) { visit(id); return }
    if (ray.ray.intersectPlane(floor, hit) && walkable(hit, world.obstacles)) { path = findPath(avatar.group.position, hit, world.obstacles); pending = null; destination.visible = path.length > 0; destination.position.set(hit.x, .06, hit.z) }
  }
  function pointerMove(event: PointerEvent) { if (paused) return; const id = hotspotAt(event); renderer.domElement.style.cursor = id ? 'pointer' : 'default'; const rect = container.getBoundingClientRect(); callbacks.hover(id, event.clientX - rect.left, event.clientY - rect.top) }
  const pointerLeave = () => callbacks.hover(null, 0, 0)
  function keyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || container.closest('main')?.querySelector('dialog[open]') || paused || event.ctrlKey || event.metaKey || event.altKey || (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName))) return
    const key = event.key.toLowerCase()
    if (isMovementKey(key)) { event.preventDefault(); keys.add(key); path = []; pending = null; destination.visible = false }
    if ((key === 'e' || key === ' ') && !event.repeat && event.target === renderer.domElement) { event.preventDefault(); if (nearest) activate(nearest) }
    if (key === 'e' && !event.repeat && event.target !== renderer.domElement && nearest) activate(nearest)
  }
  function keyUp(event: KeyboardEvent) { keys.delete(event.key.toLowerCase()) }
  const blur = () => keys.clear()
  const contextLost = (event: Event) => { event.preventDefault(); paused = true; callbacks.error() }
  renderer.domElement.addEventListener('click', sceneClick); renderer.domElement.addEventListener('pointermove', pointerMove); renderer.domElement.addEventListener('pointerleave', pointerLeave); renderer.domElement.addEventListener('webglcontextlost', contextLost)
  window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp); window.addEventListener('blur', blur)
  setRoom('upstairs'); resize()
  let previous = performance.now(), frame = 0
  function tick(now: number) {
    if (disposed) return
    frame = requestAnimationFrame(tick)
    const dt = Math.min((now - previous) / 1000, .04); previous = now
    if (document.hidden) { keys.clear(); return }
    walkTime += dt
    let walking = false
    if (!paused) {
      if (!reducedMotion) world.update?.(dt, walkTime, avatar.group.position, pending)
      const horizontal = Number(keys.has('arrowright')) - Number(keys.has('arrowleft'))
      const vertical = Number(keys.has('arrowdown')) - Number(keys.has('arrowup'))
      let dx = (horizontal + vertical) / Math.SQRT2, dz = (-horizontal + vertical) / Math.SQRT2
      const p = avatar.group.position
      if (horizontal || vertical) { path = []; pending = null; destination.visible = false }
      else if (path.length) { const next = path[0], distance = Math.hypot(next.x - p.x, next.z - p.z); if (distance < .09) path.shift(); else { dx = (next.x - p.x) / distance; dz = (next.z - p.z) / distance } }
      const length = Math.hypot(dx, dz)
      if (length) {
        const step = dt * 2.9; dx = dx / length * step; dz = dz / length * step
        const oldX = p.x, oldZ = p.z
        if (walkable({ x: p.x + dx, z: p.z }, world.obstacles)) p.x += dx
        if (walkable({ x: p.x, z: p.z + dz }, world.obstacles)) p.z += dz
        walking = Math.hypot(p.x - oldX, p.z - oldZ) > .001
        if (!walking && path.length && !(horizontal || vertical) && walkTime - lastRepath > .4) {
          const target = pending ? world.hotspots.find(h => h.id === pending) : null
          if (target) path = interactionPath(p, target, world.obstacles)
          else path = findPath(p, path[path.length - 1], world.obstacles)
          lastRepath = walkTime
        }
        if (walking) avatar.group.rotation.y = Math.atan2(dx, dz)
        if (walking && walkTime - lastStep > .35) { lastStep = walkTime; chime([160]) }
      }
      if (!path.length && pending) { const target = world.hotspots.find(h => h.id === pending); const id = pending; pending = null; if (target && canInteract(p, target)) activate(id) }
      if (!path.length) destination.visible = false
      let nextNearest: string | null = null, distance = 1.35
      for (const h of world.hotspots) { const d = interactionDistance(p, h); if (d < distance && canInteract(p, h)) { distance = d; nextNearest = h.id } }
      if (nextNearest !== nearest) { nearest = nextNearest; callbacks.nearby(nearest) }
    }
    avatar.animate(reducedMotion ? 0 : walkTime, walking)
    ring.position.x = avatar.group.position.x; ring.position.z = avatar.group.position.z
    if (!reducedMotion) world.animated.forEach(fn => fn(walkTime))
    for (const h of world.hotspots) h.marker.scale.setScalar(h.id === nearest ? 1.4 : 1)
    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(tick)
  return {
    setRoom,
    setPaused(value) { paused = value; if (value) { keys.clear(); callbacks.hover(null, 0, 0) } },
    setSound(value) { sound = value; if (value) chime() },
    interact() { if (nearest && !paused) activate(nearest) }, visit,
    zoom(delta) { zoom = THREE.MathUtils.clamp(zoom + delta, .75, 3); resize() },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); window.removeEventListener('blur', blur)
      renderer.domElement.removeEventListener('click', sceneClick); renderer.domElement.removeEventListener('pointermove', pointerMove); renderer.domElement.removeEventListener('pointerleave', pointerLeave); renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      const geometries = new Set<THREE.BufferGeometry>(), localMaterials = new Set<THREE.Material>()
      const collect = (obj: THREE.Object3D) => { if (obj instanceof THREE.Mesh) { geometries.add(obj.geometry); (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => localMaterials.add(m)) } }
      scene.traverse(collect); worlds.forEach(w => w.root.traverse(collect)); geometries.forEach(g => g.dispose()); localMaterials.forEach(m => m.dispose()); disposeMaterials(); renderer.dispose(); renderer.domElement.remove(); if (audio) void audio.close()
    },
  }
}
