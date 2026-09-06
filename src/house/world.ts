import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { RoomId } from './content'
import type { Obstacle, Point } from './navigation'

export type Hotspot = { id: string; group: THREE.Group; approach: Point; marker: THREE.Mesh; zone?: { w: number; d: number } }
export type World = { root: THREE.Group; obstacles: Obstacle[]; hotspots: Hotspot[]; animated: ((time: number) => void)[]; spawn: Point; update?: (dt: number, time: number, player: Point, target: string | null) => void }
const C = { wood: '#b47c4f', edge: '#855b43', lightWood: '#e4b984', cream: '#fff1d2', wall: '#8faebf', green: '#65a279', darkGreen: '#365f50', blue: '#769fad', dark: '#364850', terra: '#c47450', yellow: '#efbc5b', white: '#fff8e9' }
const materials = new Map<string, THREE.MeshStandardMaterial>()
function material(color: string) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.86, flatShading: true }))
  return materials.get(color)!
}
export function box(parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, color: string) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color))
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh
}
function cylinder(parent: THREE.Object3D, x: number, y: number, z: number, top: number, bottom: number, h: number, color: string, segments = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, h, segments), material(color))
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh
}
function ball(parent: THREE.Object3D, x: number, y: number, z: number, r: number, color: string, detail = 1) {
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, detail), material(color)); mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh
}
function group(parent: THREE.Object3D, x = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g); return g }
function plant(parent: THREE.Object3D, x: number, y: number, z: number, size = 1) {
  const g = group(parent, x, z); g.name = 'potted-plant'; g.position.y = y; g.scale.setScalar(size)
  cylinder(g, 0, .19, 0, .27, .2, .38, '#c38363', 8)
  cylinder(g, 0, .39, 0, .285, .285, .07, '#dda07c', 8)
  cylinder(g, 0, .43, 0, .245, .245, .02, '#574b3d', 8)
  const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.lineTo(-.13, .19); leafShape.lineTo(-.1, .39); leafShape.lineTo(0, .56); leafShape.lineTo(.1, .39); leafShape.lineTo(.13, .19); leafShape.closePath()
  for (let i = 0; i < 6; i++) {
    const branch = group(g); branch.position.y = .44; branch.rotation.y = i * Math.PI / 3
    const leaf = new THREE.Mesh(new THREE.ExtrudeGeometry(leafShape, { depth: .035, bevelEnabled: false }), material(i % 2 ? '#689862' : '#417957'))
    leaf.rotation.x = i % 2 ? -.65 : -.95; leaf.castShadow = true; branch.add(leaf)
  }
  cylinder(g, 0, .65, 0, .025, .035, .42, '#588657', 6)
  return g
}
function picture(parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, theme = 'landscape') {
  const g = group(parent, x, z); g.position.y = y
  box(g, 0, 0, 0, w, h, .1, C.edge); box(g, 0, 0, .065, w - .12, h - .12, .035, C.cream)
  box(g, 0, 0, .09, w - .24, h - .24, .015, theme === 'code' ? C.darkGreen : '#b4caca')
  if (theme === 'code') {
    for (let i = 0; i < 5; i++) box(g, -.06 + (i % 2) * .06, .26 - i * .13, .11, w * (.28 + (i % 3) * .09), .035, .012, i % 2 ? '#e9b769' : '#a6cdb3')
  } else if (['family', 'couple', 'baby', 'dog'].includes(theme)) {
    g.name = `picture-${theme}`
    box(g, 0, -h * .27, .115, w - .24, h * .22, .015, '#88a986')
    const portrait = (px: number, py: number, scale: number, shirt: string, hair: string, long = false) => {
      const figure = group(g, px); figure.position.set(px, py, .14); figure.scale.setScalar(scale)
      if (long) box(figure, 0, .12, 0, .39, .48, .025, hair)
      box(figure, 0, -.22, .025, .36, .42, .025, shirt)
      box(figure, 0, .14, .04, .31, .32, .025, '#edbd96')
      if (hair === '#563e33') box(figure, 0, .015, .065, .29, .12, .035, '#644332')
      else { box(figure, 0, .32, .055, .35, .09, .025, hair); box(figure, -.135, .25, .055, .08, .14, .025, hair) }
      for (const side of [-1, 1]) { box(figure, side * .075, .14, .065, .035, .04, .015, '#354050'); box(figure, side * .105, -.46, .035, .13, .13, .025, '#536e80') }
      box(figure, 0, .045, .065, .07, .018, .015, '#a56852')
    }
    if (theme === 'family' || theme === 'couple') {
      portrait(-w * .2, h * .03, h * .75, '#ce8a53', '#563e33')
      portrait(w * .2, h * .03, h * .75, '#ca927c', '#634231', true)
      if (theme === 'family') portrait(0, -h * .21, h * .4, '#749bc8', '#916046')
    } else if (theme === 'baby') portrait(0, 0, h * .94, '#749bc8', '#916046')
    else {
      box(g, 0, -h * .08, .14, w * .47, h * .35, .025, '#c39960')
      box(g, 0, h * .14, .16, w * .42, h * .36, .025, '#d8b37a')
      for (const side of [-1, 1]) { box(g, side * w * .235, h * .11, .18, w * .12, h * .37, .025, '#805f3e'); box(g, side * w * .11, h * .16, .19, .045, .045, .025, '#354050') }
      box(g, 0, h * .03, .2, w * .24, h * .15, .025, '#e9cca0'); box(g, 0, h * .06, .22, .08, .055, .025, '#354050')
    }
  } else {
    const sun = cylinder(g, w * .2, h * .2, .12, w * .11, w * .11, .02, '#f6d18e'); sun.rotation.x = Math.PI / 2
    for (let i = 0; i < 3; i++) { const mountain = new THREE.Mesh(new THREE.ConeGeometry(w * .25, h * .45, 3), material(i % 2 ? '#749789' : '#467f73')); mountain.position.set((i - 1) * w * .21, -h * .15, .13 + i * .01); mountain.scale.z = .05; g.add(mountain) }
  }
  return g
}
function windowFrame(parent: THREE.Object3D, x: number, z: number) {
  box(parent, x, 1.95, z, 2.25, 1.7, .14, C.edge)
  box(parent, x, 1.95, z + .1, 2.08, 1.53, .1, '#b3d5cf')
  box(parent, x, 1.96, z + .17, .08, 1.55, .1, C.white)
  box(parent, x, 1.95, z + .17, 2.08, .08, .1, C.white)
  box(parent, x, 1.07, z + .2, 2.5, .12, .5, C.white)
  for (const offset of [-1.19, 1.19]) { box(parent, x + offset, 1.9, z + .2, .32, 1.95, .15, '#e6c799'); box(parent, x + offset, 2.91, z + .22, .43, .13, .18, C.cream) }
}
function rug(parent: THREE.Object3D, x: number, z: number, w: number, d: number, color: string) {
  box(parent, x, .025, z, w, .035, d, color)
  for (const sign of [-1, 1]) { box(parent, x, .048, z + sign * (d / 2 - .15), w - .18, .012, .07, C.cream); for (let i = 0; i < w * 6; i++) box(parent, x - w / 2 + i / 6, .03, z + sign * (d / 2 + .06), .035, .03, .15, C.cream) }
}
function table(parent: THREE.Object3D, x: number, z: number, w: number, d: number, height = 1.05) {
  const g = group(parent, x, z)
  box(g, 0, height, 0, w, .15, d, C.lightWood)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, sx * (w / 2 - .15), height / 2, sz * (d / 2 - .13), .14, height, .14, C.edge)
  return g
}
export function person(parent: THREE.Object3D, x: number, z: number, shirt = '#d78652', hair: string | null = null) {
  const g = group(parent, x, z), body = group(g), leftLeg = group(body, -.15), rightLeg = group(body, .15)
  box(leftLeg, 0, .26, 0, .24, .45, .26, '#435967'); box(rightLeg, 0, .26, 0, .24, .45, .26, '#435967')
  box(leftLeg, 0, .08, .08, .27, .16, .39, C.white); box(rightLeg, 0, .08, .08, .27, .16, .39, C.white)
  box(body, 0, .75, 0, .58, .58, .35, shirt)
  const arms = [-1, 1].map(s => { const a = group(body, s * .39); a.position.y = .91; box(a, 0, -.15, 0, .19, .33, .27, shirt); box(a, 0, -.36, 0, .18, .18, .23, '#e5b68e'); return a })
  const head = box(body, 0, 1.19, 0, .49, .48, .43, '#e5b68e'); head.name = hair ? 'head' : 'alex-bald-head'
  if (hair) {
    box(body, 0, 1.46, -.025, .55, .15, .49, hair)
    box(body, 0, 1.31, -.22, .52, .24, .1, hair); box(body, -.23, 1.38, .12, .12, .15, .24, hair)
  } else {
    const beard = box(body, 0, 1.015, .14, .46, .2, .24, '#644332'); beard.name = 'alex-brown-beard'
    for (const side of [-1, 1]) box(body, side * .21, 1.105, .19, .075, .2, .1, '#644332')
    box(body, 0, 1.105, .24, .21, .055, .035, '#644332')
  }
  for (const s of [-1, 1]) box(body, s * .12, 1.22, .222, .052, .065, .02, C.dark)
  box(body, 0, 1.1, .228, .09, .025, .018, '#a46449')
  let phase = 0, blend = 0
  return { group: g, animate: (t: number, walking: boolean, dt = 1 / 60) => {
    blend += ((walking ? 1 : 0) - blend) * (1 - Math.exp(-dt * 18))
    if (walking) phase += dt * 12
    const stride = Math.sin(phase) * .5 * blend
    leftLeg.rotation.x = stride; rightLeg.rotation.x = -stride; arms[0].rotation.x = -stride; arms[1].rotation.x = stride
    body.position.y = Math.abs(Math.sin(phase)) * .065 * blend + Math.sin(t * 2) * .015 * (1 - blend)
  } }

}
export function buildWorld(room: RoomId): World {
  const root = new THREE.Group(), obstacles: Obstacle[] = [], hotspots: Hotspot[] = [], animated: World['animated'] = []
  let update: World['update']
  function obstacle(x: number, z: number, w: number, d: number) { obstacles.push({ x, z, w, d }) }
  function hot(id: string, g: THREE.Group, approach: Point, height: number) {
    g.userData.hotspot = id
    const marker = new THREE.Mesh(new THREE.OctahedronGeometry(.12), new THREE.MeshBasicMaterial({ color: '#ffd887' }))
    marker.position.set(g.position.x, height, g.position.z); marker.userData.hotspot = id; root.add(marker)
    const zones: Record<string, { w: number; d: number }> = {
      baby: { w: .85, d: .9 }, wife: { w: .65, d: .5 }, dog: { w: 1, d: 1 },
      stairsDown: { w: 1.85, d: 1.95 }, stairsUp: { w: 1.85, d: 1.95 },
      tesla: { w: 2.3, d: 4.1 }, outside: { w: 1.4, d: .3 }, inside: { w: 1.4, d: .3 },
    }
    hotspots.push({ id, group: g, approach, marker, zone: zones[id] }); animated.push(t => { marker.position.x = g.position.x; marker.position.z = g.position.z; marker.position.y = height + Math.sin(t * 2.6 + g.position.x) * .09; marker.rotation.y = t * .8 })
  }
  // Cut every layer of the upstairs floor around the stairwell.
  function floorBox(x: number, y: number, z: number, w: number, h: number, d: number, color: string) {
    if (room !== 'upstairs') { box(root, x, y, z, w, h, d, color); return }
    const left = x - w / 2, right = x + w / 2, back = z - d / 2, front = z + d / 2
    const x0 = Math.max(left, 3.275), x1 = Math.min(right, 5.025), z0 = Math.max(back, 2.6), z1 = Math.min(front, 4.5)
    if (x0 >= x1 || z0 >= z1) { box(root, x, y, z, w, h, d, color); return }
    const patch = (a: number, b: number, c: number, e: number) => { if (b - a > .001 && e - c > .001) box(root, (a + b) / 2, y, (c + e) / 2, b - a, h, e - c, color) }
    patch(left, x0, back, front); patch(x1, right, back, front); patch(x0, x1, back, z0); patch(x0, x1, z1, front)
  }
  const outdoors = room === 'backyard'
  floorBox(0, -.31, 0, 12.4, .6, 10.4, outdoors ? '#748d59' : C.edge)
  floorBox(0, -.045, 0, 12.15, .12, 10.15, outdoors ? '#94b276' : C.lightWood)
  if (!outdoors) {
    for (let row = 0; row < 20; row++) for (let col = 0; col < 6; col++) {
      const shades = ['#dcb386', '#dfb98b', '#d5aa7c', '#e5bf90']
      floorBox(-5 + col * 2, -.001, -4.75 + row * .5, 1.98, .022, .482, shades[(row * 7 + col * 3) % shades.length])
    }
    box(root, -6.05, 1.48, 0, .18, 3.05, 10.2, C.wall)
    if (room === 'downstairs') {
      box(root, -4.2, 1.48, -5.05, 3.6, 3.05, .18, C.wall)
      box(root, 2.5, 1.48, -5.05, 7, 3.05, .18, C.wall)
      box(root, -1.7, 2.72, -5.05, 1.4, .57, .18, C.wall)
    } else box(root, 0, 1.48, -5.05, 12.2, 3.05, .18, C.wall)
    box(root, -5.93, .15, 0, .07, .25, 10.05, C.cream); box(root, 0, .15, -4.93, 12, .25, .07, C.cream)
    box(root, -6.05, 3.03, 0, .24, .12, 10.24, C.cream); box(root, 0, 3.03, -5.05, 12.3, .12, .24, C.cream)
    // Cutaway corner posts make the floating room read as a tiny dollhouse.
    box(root, 6.04, .2, -5.04, .22, .5, .22, C.cream); box(root, -6.04, .2, 5.04, .22, .5, .22, C.cream)
  }
  if (room === 'upstairs') {
    windowFrame(root, -3.8, -4.89); picture(root, .1, 2.18, -4.85, 1.2, 1.2, 'code')
    const bedsideGallery = group(root, -5.89, -2.3); bedsideGallery.rotation.y = Math.PI / 2; bedsideGallery.name = 'bedside-gallery'
    picture(bedsideGallery, 0, 2.13, 0, 1.5, 1.05, 'landscape')
    picture(bedsideGallery, 1.42, 2.13, 0, .85, 1.05, 'couple')
    box(bedsideGallery, .3, 1.4, .18, 2.65, .09, .43, C.lightWood)
    plant(bedsideGallery, -.63, 1.45, .2, .48)
    for (let i = 0; i < 3; i++) box(bedsideGallery, .65, 1.49 + i * .08, .18, .56, .075, .28, [C.terra, C.blue, C.cream][i])
    const bed = group(root, -3.8, -2.7)
    box(bed, 0, .36, 0, 2.4, .55, 3.45, C.edge); box(bed, 0, .72, 0, 2.38, .28, 3.3, C.white)
    box(bed, 0, 1.02, -1.66, 2.54, 1.2, .14, C.lightWood)
    box(bed, 0, .91, .45, 2.41, .13, 2.25, C.green); box(bed, 0, .98, -.49, 2.43, .07, .38, '#9fbea2')
    for (const x of [-.56, .56]) box(bed, x, .96, -1.12, .96, .24, .6, '#fff6e1')
    for (const x of [-.8, -.4, 0, .4, .8]) box(bed, x, .984, .53, .025, .015, 1.85, '#779d80')
    obstacle(-3.8, -2.7, 2.4, 3.45); hot('bed', bed, { x: -2.1, z: -1.3 }, 1.8)
    const desk = table(root, .1, -3.67, 2.65, 1.3)
    box(desk, 0, 1.17, .04, 1.15, .065, .72, '#697d7c')
    const screen = box(desk, 0, 1.58, -.28, 1.15, .78, .075, C.dark); screen.rotation.x = -.13
    box(desk, 0, 1.6, -.222, 1.01, .62, .02, '#8bbbac')
    for (let i = 0; i < 5; i++) box(desk, -.12 + (i % 2) * .06, 1.8 - i * .09, -.202, .57 - (i % 3) * .1, .025, .015, i % 2 ? '#edf5d7' : '#3e7568')
    for (let row = 0; row < 3; row++) for (let col = 0; col < 9; col++) box(desk, -.43 + col * .105, 1.207, -.08 + row * .13, .075, .01, .08, '#c2d2ca')
    cylinder(desk, .96, 1.28, .23, .13, .11, .28, C.terra); cylinder(desk, .96, 1.427, .23, .105, .105, .009, '#503d30')
    plant(desk, -1.01, 1.13, -.18, .5)
    obstacle(.1, -3.67, 2.65, 1.3); hot('laptop', desk, { x: .1, z: -2.35 }, 2.45)
    const chair = group(root, .15, -1.6); chair.name = 'desk-chair'; chair.rotation.y = -.2
    box(chair, 0, .53, 0, .72, .14, .68, C.lightWood)
    box(chair, 0, .63, -.025, .64, .1, .55, '#749378')
    for (const x of [-.28, .28]) for (const z of [-.26, .26]) box(chair, x, .25, z, .09, .5, .09, C.edge)
    for (const x of [-.28, .28]) box(chair, x, .92, .27, .085, .75, .085, C.edge)
    box(chair, 0, 1.14, .27, .7, .3, .11, C.lightWood)
    for (const x of [-.16, 0, .16]) box(chair, x, .88, .27, .055, .26, .075, C.lightWood)
    obstacle(.15, -1.6, .82, .82)
    const printer = table(root, 3.76, -3.55, 2.15, 1.55)
    printer.name = 'bambu-a1-printer'
    // Open A1 bed-slinger: exposed uprights, X rail, moving bed and top spool.
    box(printer, 0, 1.23, 0, 1.5, .19, 1.24, '#d9dddb')
    box(printer, 0, 1.35, .08, .34, .12, 1.36, '#525f64')
    const printBed = group(printer, 0, .12)
    box(printBed, 0, 1.44, 0, 1.18, .09, 1.04, '#4a5355')
    box(printBed, 0, 1.495, 0, 1.13, .018, .99, '#b6a174')
    cylinder(printBed, 0, 1.63, 0, .14, .21, .26, '#6eaf9f', 8)
    for (const x of [-.66, .66]) {
      box(printer, x, 2.01, -.43, .13, 1.56, .17, '#d6dcda')
      cylinder(printer, x, 2.02, -.325, .025, .025, 1.41, '#77868a', 8)
    }
    box(printer, 0, 2.81, -.43, 1.48, .15, .23, '#d6dcda')
    box(printer, 0, 2.11, -.27, 1.38, .17, .18, '#b9c3c4')
    box(printer, 0, 2.14, -.17, 1.26, .037, .025, '#4c5b5e')
    const nozzle = group(printer, 0, -.12); nozzle.position.y = 2.06
    box(nozzle, 0, 0, 0, .36, .35, .32, '#f0f1e8')
    box(nozzle, 0, -.035, .175, .25, .22, .04, '#59656a')
    const fan = cylinder(nozzle, 0, -.02, .21, .075, .075, .02, '#303e43', 10); fan.rotation.x = Math.PI / 2
    cylinder(nozzle, 0, -.23, 0, .045, .065, .11, '#b99459', 8)
    box(printer, .42, 3.03, -.43, .09, .36, .09, '#677579')
    const spool = group(printer, .42, -.43); spool.position.y = 3.28; spool.name = 'filament-spool'
    for (const z of [-.13, .13]) { const rim = cylinder(spool, 0, 0, z, .32, .32, .045, '#e3e5dc', 16); rim.rotation.x = Math.PI / 2 }
    const filament = cylinder(spool, 0, 0, 0, .265, .265, .22, '#6eaf9f', 16); filament.rotation.x = Math.PI / 2
    const hub = cylinder(spool, 0, 0, .16, .09, .09, .025, '#536064', 12); hub.rotation.x = Math.PI / 2
    const printerScreen = group(printer, .88, .35); printerScreen.position.y = 1.44; printerScreen.rotation.x = -.35
    box(printerScreen, 0, 0, 0, .38, .29, .07, '#454f54'); box(printerScreen, 0, 0, .045, .29, .2, .015, '#87b7ac')
    box(printerScreen, 0, -.035, .057, .21, .025, .01, '#e0eed6')
    animated.push(t => { nozzle.position.x = Math.sin(t * 1.6) * .35; printBed.position.z = .12 + Math.cos(t) * .18 })
    obstacle(3.76, -3.55, 2.15, 1.55); hot('printer', printer, { x: 3.7, z: -2.15 }, 3.85)
    const shelf = group(root, -5.38, 1.81); shelf.rotation.y = Math.PI / 2
    box(shelf, 0, 1.02, -.2, 1.95, 2, .16, C.edge)
    for (const x of [-.95, .95]) box(shelf, x, 1.02, .05, .12, 2.06, .65, C.lightWood)
    for (const y of [.12, .77, 1.43, 2.03]) box(shelf, 0, y, .05, 2, .1, .69, C.lightWood)
    const bookColors = ['#a96b55', '#537d79', '#d9ba74', '#859665', '#ded6b6']
    for (let level = 0; level < 3; level++) for (let i = 0; i < 7; i++) { const h = .32 + ((i * 3 + level) % 4) * .05; box(shelf, -.71 + i * .23, .17 + level * .65 + h / 2, .1, .15, h, .36, bookColors[(i + level) % 5]) }
    plant(shelf, .48, 2.1, 0, .65)
    obstacle(-5.38, 1.81, .8, 2); hot('bookshelf', shelf, { x: -4.25, z: 1.8 }, 2.65)
    const guitar = group(root, -4.1, -.05); guitar.rotation.z = -.13
    guitar.name = 'stratocaster'
    const bodyShape = new THREE.Shape()
    const outline = [[0,.17],[-.24,.19],[-.36,.34],[-.34,.58],[-.23,.72],[-.24,1.01],[-.15,1.1],[-.09,.83],[.09,.83],[.16,.99],[.24,.92],[.22,.71],[.33,.57],[.35,.33],[.23,.19]]
    outline.forEach(([x,y], i) => i ? bodyShape.lineTo(x,y) : bodyShape.moveTo(x,y)); bodyShape.closePath()
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(bodyShape, { depth: .14, bevelEnabled: false }), material('#b9554f')); body.castShadow = true; guitar.add(body)
    const guardShape = new THREE.Shape()
    ;[[-.13,.31],[-.22,.43],[-.17,.67],[-.13,.85],[.08,.83],[.16,.7],[.2,.5],[.12,.31]].forEach(([x,y],i) => i ? guardShape.lineTo(x,y) : guardShape.moveTo(x,y)); guardShape.closePath()
    const guard = new THREE.Mesh(new THREE.ExtrudeGeometry(guardShape, { depth: .018, bevelEnabled: false }), material('#f4ecd6')); guard.position.z = .145; guitar.add(guard)
    box(guitar, 0, 1.25, .08, .115, .88, .08, '#d7b87f')
    for (let i = 0; i < 11; i++) box(guitar, 0, .9 + i * .066, .129, .118, .009, .008, '#9c9f8d')
    const head = box(guitar, .035, 1.8, .08, .19, .31, .085, '#dfbf86'); head.rotation.z = -.16
    for (let i = 0; i < 6; i++) box(guitar, -.065 + i * .007, 1.69 + i * .043, .08, .075, .025, .04, '#dce0d5')
    for (const y of [.48,.61,.74]) box(guitar, 0, y, .177, .18, .043, .028, '#faf6e8')
    box(guitar, 0, .36, .176, .19, .1, .035, '#a2aaa3')
    const tremolo = box(guitar, .125, .32, .207, .018, .2, .018, '#c8d0c5'); tremolo.rotation.z = -.48
    for (const [x,y] of [[.19,.43],[.23,.33],[.15,.25]]) { const knob = cylinder(guitar, x, y, .17, .03, .03, .035, '#fff3d4', 8); knob.rotation.x = Math.PI / 2 }
    for (let i = 0; i < 6; i++) box(guitar, -.038 + i * .015, 1.04, .2, .003, 1.41, .003, '#e1ded0')
    box(guitar, 0, .03, 0, .64, .07, .45, C.dark)
    obstacle(-4.1, -.05, .7, .5); hot('guitar', guitar, { x: -3.1, z: .3 }, 2.25)
    rug(root, -.15, 1.35, 4.1, 3.05, '#bd765c')
    // A geometric woven motif, set into the actual rug.
    const motif = box(root, -.15, .052, 1.35, 1.3, .01, 1.3, '#d5a277'); motif.rotation.y = Math.PI / 4
    const center = box(root, -.15, .063, 1.35, .73, .01, .73, '#b36e54'); center.rotation.y = Math.PI / 4
    plant(root, 5.12, 0, -.65, 1.2)
    stairs('stairsDown', 4.15, 3.55, 'down')
  } else if (room === 'downstairs') {
    const sideWindow = group(root, -5.89, -1.65); sideWindow.rotation.y = Math.PI / 2
    windowFrame(sideWindow, 0, 0)
    const photos = group(root, -5.88, 1.65); photos.rotation.y = Math.PI / 2
    picture(photos, 0, 2.07, 0, 1.18, 1.4, 'family'); picture(photos, 1.35, 2.16, 0, .83, .87, 'couple'); picture(photos, -1.3, 2.16, 0, .83, .87, 'baby')
    hot('photos', photos, { x: -4.45, z: 1.65 }, 2.95)
    const consoleTable = table(root, -5.34, 1.65, 1.95, .65, .88); consoleTable.rotation.y = Math.PI / 2
    plant(consoleTable, -.65, .96, 0, .5)
    obstacle(-5.34, 1.65, .65, 1.95)
    const sofa = group(root, -4.7, -1.45); sofa.rotation.y = Math.PI / 2
    box(sofa, 0, .39, 0, 3.45, .6, 1.35, C.darkGreen); box(sofa, 0, .97, -.54, 3.4, 1.03, .3, C.green)
    for (const x of [-1.63, 1.63]) box(sofa, x, .76, .04, .3, .75, 1.38, C.green)
    for (const x of [-1.04, 0, 1.04]) box(sofa, x, .76, .11, .96, .22, 1.04, '#87a98b')
    box(sofa, -.94, 1.04, -.27, .61, .52, .2, C.yellow).rotation.z = .15
    box(sofa, 1, 1.04, -.25, .61, .52, .2, '#e5c79a').rotation.z = -.13
    obstacle(-4.7, -1.45, 1.4, 3.5)
    rug(root, -1.45, -.4, 4.3, 3.8, '#d5be8b')
    for (let i = 0; i < 4; i++) box(root, -1.45, .05, -1.8 + i * .92, 3.85, .01, .045, '#f4dfb2')
    const coffee = table(root, -2.2, -.65, 1.6, 1.1, .57); box(coffee, -.23, .7, 0, .59, .12, .43, '#b06d53'); box(coffee, -.23, .77, 0, .5, .015, .36, C.cream); cylinder(coffee, .45, .75, .1, .13, .1, .24, C.white)
    obstacle(-2.2, -.65, 1.6, 1.1)
    const wife = person(root, 3.0, -2.4, '#cb9275', '#634231'); wife.group.rotation.y = .5
    box(wife.group, 0, 1.17, -.23, .57, .58, .18, '#634231'); hot('wife', wife.group, { x: 3, z: -1.25 }, 1.96); const wifeBounds = { x: 3, z: -2.4, w: .85, d: .75 }; obstacles.push(wifeBounds)
    wife.group.name = 'roaming-wife'
    const wifeHotspot = hotspots.find(h => h.id === 'wife')!
    wifeHotspot.zone = { w: .85, d: .75 }
    let wifeWalking = false
    animated.push(t => wife.animate(t, wifeWalking))
    const kitchen = group(root, 2.25, -4.3); kitchen.name = 'kitchen'
    box(kitchen, 0, .53, 0, 4.15, 1.05, 1.1, '#819785')
    box(kitchen, 0, 1.11, .03, 4.3, .15, 1.2, '#f4edda')
    for (let i = 0; i < 4; i++) {
      const x = -1.54 + i * 1.03
      box(kitchen, x, .54, .568, .96, .89, .06, '#a7bba0')
      box(kitchen, x + .28, .81, .612, .19, .045, .04, '#57685d')
    }
    box(kitchen, .2, 1.55, -.57, 4, .71, .05, '#dfd8bf')
    for (let i = 0; i < 12; i++) box(kitchen, -1.8 + i * .33, 1.55, -.533, .015, .7, .015, '#f5f0dc')
    for (const y of [1.35, 1.65]) box(kitchen, .2, y, -.53, 4, .015, .015, '#f5f0dc')
    box(kitchen, -1.2, 1.195, .02, .99, .025, .72, '#8caaa9'); box(kitchen, -1.2, 1.212, .02, .79, .012, .54, '#526b6d')
    cylinder(kitchen, -1.2, 1.4, -.39, .045, .045, .42, '#9cafae', 8); box(kitchen, -1.2, 1.6, -.24, .08, .08, .35, '#9cafae')
    box(kitchen, .78, 1.206, .03, 1.12, .05, .87, '#39464a')
    for (const x of [.5, 1.04]) for (const z of [-.2, .27]) cylinder(kitchen, x, 1.24, z, .16, .16, .02, '#657275', 12)
    box(kitchen, .78, .56, .61, .89, .62, .065, '#3a464b'); box(kitchen, .78, .75, .66, .65, .055, .055, '#a8b4b0')
    box(kitchen, .62, 2.44, -.37, 2.75, .87, .49, '#a7bba0')
    for (const x of [-.25, .64, 1.53]) { box(kitchen, x, 2.44, -.104, .84, .79, .045, '#bdcbae'); box(kitchen, x + .25, 2.19, -.07, .13, .04, .045, '#57685d') }
    const fridge = group(root, 5.03, -4.23)
    box(fridge, 0, 1.32, 0, 1.32, 2.62, 1.37, '#d3d8ce'); box(fridge, 0, 1.39, .704, 1.2, 2.37, .075, '#f0eee0')
    box(fridge, 0, 1.95, .75, 1.19, .045, .025, '#8d9d97'); box(fridge, -.44, 1.61, .775, .065, .43, .06, '#647772')
    box(fridge, .22, 1.5, .77, .28, .31, .025, '#e7c789'); box(fridge, .16, 1.67, .79, .065, .065, .025, '#cc7762')
    hot('fridge', fridge, { x: 5.03, z: -2.65 }, 3.05)
    obstacle(2.25, -4.3, 4.3, 1.2); obstacle(5.03, -4.23, 1.32, 1.4)
    const baby = group(root, 1.45, -.6)
    for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) box(baby, (x - 1) * .46, .045, (z - 1) * .46, .45, .07, .45, ['#e7b378', '#88b8ab', '#e8d98c'][(x + z) % 3])
    const babyBody = group(baby)
    box(babyBody, 0, .34, 0, .51, .43, .4, '#749bc8')
    box(babyBody, 0, .46, .22, .3, .25, .05, '#fff5d2')
    const babyFace = box(babyBody, 0, .81, .015, .62, .57, .53, '#f3c797'); babyFace.name = 'baby-face'
    box(babyBody, -.08, 1.115, -.05, .2, .08, .2, '#916046')
    for (const side of [-1, 1]) {
      box(babyBody, side * .16, .84, .289, .07, .075, .025, '#30384d')
      box(babyBody, side * .24, .72, .289, .075, .055, .025, '#db9983')
      box(babyBody, side * .22, .145, .32, .24, .18, .3, '#f3c797')
    }
    box(babyBody, 0, .69, .31, .17, .12, .06, '#e89288'); box(babyBody, 0, .69, .352, .07, .065, .03, '#fff4dd')
    const hands = [-1, 1].map(side => {
      const arm = group(babyBody, side * .35); arm.position.y = .44
      box(arm, 0, 0, 0, .17, .31, .2, '#f3c797'); arm.rotation.z = side * .5; return arm
    })
    animated.push(t => { babyBody.position.y = Math.sin(t * 3) * .018; hands[0].rotation.z = -.5 + Math.sin(t * 4) * .25; hands[1].rotation.z = .5 - Math.sin(t * 4) * .25 })
    obstacle(1.45, -.6, .85, .9); hot('baby', baby, { x: 1.6, z: .6 }, 1.65)
    const dog = group(root, -2.3, 2.5); dog.name = 'roaming-dog'
    const dogLegs: THREE.Mesh[] = []
    // Lola: sandy lab/shepherd coat, cream chest and muzzle, folded triangular ears.
    box(dog, 0, .43, -.03, .53, .49, .96, '#c4ae87')
    box(dog, 0, .64, -.15, .46, .08, .64, '#a9977a')
    box(dog, 0, .42, .39, .44, .4, .2, '#eee3c9')
    box(dog, 0, .77, .4, .48, .43, .46, '#d3bf98')
    box(dog, 0, .68, .68, .3, .22, .38, '#eee3c9')
    box(dog, 0, .72, .88, .16, .11, .06, '#343c3e')
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(.17, .32, 3), material('#bca582'))
      ear.position.set(side * .245, .93, .35); ear.rotation.z = side * .95; ear.rotation.x = -.35; dog.add(ear)
      box(dog, side * .15, .81, .638, .055, .065, .02, '#3d3830')
      for (const z of [-.35, .29]) {
        const leg = box(dog, side * .19, .17, z, .16, .34, .19, '#e5d9bc'); dogLegs.push(leg)
        box(leg, 0, -.115, .035, .18, .1, .25, '#f0e6ce')
      }
    }
    box(dog, 0, .55, .38, .54, .07, .47, '#718f86')
    const tail = group(dog, 0, -.48); tail.position.y = .51
    box(tail, 0, .06, -.24, .18, .17, .52, '#c4ae87'); box(tail, 0, .06, -.5, .14, .14, .15, '#e5d9bc'); tail.rotation.x = .35
    animated.push(t => { tail.rotation.y = Math.sin(t * 9) * .65 }); hot('dog', dog, { x: -2.3, z: 3.6 }, 1.36)
    const dogBounds = { x: dog.position.x, z: dog.position.z, w: 1, d: 1 }; obstacles.push(dogBounds)
    const dogHotspot = hotspots.find(h => h.id === 'dog')!
    const patrol = [{ x: -3.4, z: 3.3 }, { x: -.9, z: 3.55 }, { x: 1.8, z: 2 }, { x: -2.3, z: 2.5 }]
    let waypoint = 0, rest = 1.5
    const clear = (point: Point, margin: number) => Math.abs(point.x) < 5.5 && Math.abs(point.z) < 4.5 && !obstacles.some(o => o !== dogBounds && Math.abs(point.x - o.x) < o.w / 2 + margin && Math.abs(point.z - o.z) < o.d / 2 + margin)
    update = (dt, time, player, target) => {
      const held = target === 'dog' || Math.hypot(player.x - dog.position.x, player.z - dog.position.z) < 1.8
      let moving = false
      if (!held) {
        rest = Math.max(0, rest - dt)
        if (!rest) {
          const goal = patrol[waypoint], dx = goal.x - dog.position.x, dz = goal.z - dog.position.z, distance = Math.hypot(dx, dz)
          if (distance < .06) { waypoint = (waypoint + 1) % patrol.length; rest = 1.5 }
          else {
            const step = Math.min(dt * .7, distance), next = { x: dog.position.x + dx / distance * step, z: dog.position.z + dz / distance * step }
            if (clear(next, .65) && Math.hypot(player.x - next.x, player.z - next.z) > 1.75) {
              dog.position.set(next.x, 0, next.z); dog.rotation.y = Math.atan2(dx, dz); moving = true
            } else { waypoint = (waypoint + 1) % patrol.length; rest = .5 }
          }
        }
      }
      dogBounds.x = dog.position.x; dogBounds.z = dog.position.z
      dogLegs.forEach((leg, index) => { leg.rotation.x = moving ? Math.sin(time * 10 + (index % 3 ? Math.PI : 0)) * .38 : 0 })
      dogHotspot.marker.position.x = dog.position.x; dogHotspot.marker.position.z = dog.position.z
      if (target !== 'dog') {
        const candidates = [0, Math.PI / 2, Math.PI, -Math.PI / 2].map(angle => ({ x: dog.position.x + Math.sin(angle) * 1.1, z: dog.position.z + Math.cos(angle) * 1.1 })).filter(p => clear(p, .24))
        candidates.sort((a, b) => Math.hypot(a.x - player.x, a.z - player.z) - Math.hypot(b.x - player.x, b.z - player.z))
        if (candidates[0]) Object.assign(dogHotspot.approach, candidates[0])
      }
    }
    const updateDog = update
    const wifePatrol = [{ x: .25, z: -2.55 }, { x: 3.95, z: -2.3 }, { x: 4.6, z: -.85 }, { x: 3.25, z: .5 }, { x: 3, z: -2.4 }]
    let wifeWaypoint = 0, wifeRest = 2
    update = (dt, time, player, target) => {
      updateDog?.(dt, time, player, target)
      wifeWalking = false
      const held = target === 'wife' || Math.hypot(player.x - wife.group.position.x, player.z - wife.group.position.z) < 1.7
      if (!held) {
        wifeRest = Math.max(0, wifeRest - dt)
        if (!wifeRest) {
          const goal = wifePatrol[wifeWaypoint], dx = goal.x - wife.group.position.x, dz = goal.z - wife.group.position.z, distance = Math.hypot(dx, dz)
          if (distance < .07) { wifeWaypoint = (wifeWaypoint + 1) % wifePatrol.length; wifeRest = 2 }
          else {
            const step = Math.min(dt * .6, distance), next = { x: wife.group.position.x + dx / distance * step, z: wife.group.position.z + dz / distance * step }
            const blocked = obstacles.some(o => o !== wifeBounds && Math.abs(next.x - o.x) < o.w / 2 + .6 && Math.abs(next.z - o.z) < o.d / 2 + .6)
            if (!blocked && Math.hypot(next.x - player.x, next.z - player.z) > 1.65) { wife.group.position.set(next.x, 0, next.z); wife.group.rotation.y = Math.atan2(dx, dz); wifeWalking = true }
            else { wifeWaypoint = (wifeWaypoint + 1) % wifePatrol.length; wifeRest = .5 }
          }
        }
      }
      wifeBounds.x = wife.group.position.x; wifeBounds.z = wife.group.position.z
      wifeHotspot.marker.position.x = wife.group.position.x; wifeHotspot.marker.position.z = wife.group.position.z
      if (target !== 'wife') {
        const sides = [[0, 1.1], [1.1, 0], [0, -1.1], [-1.1, 0]].map(([x, z]) => ({ x: wife.group.position.x + x, z: wife.group.position.z + z }))
          .filter(p => Math.abs(p.x) < 5.5 && Math.abs(p.z) < 4.5 && !obstacles.some(o => Math.abs(p.x - o.x) < o.w / 2 + .24 && Math.abs(p.z - o.z) < o.d / 2 + .24))
        sides.sort((a, b) => Math.hypot(a.x - player.x, a.z - player.z) - Math.hypot(b.x - player.x, b.z - player.z))
        if (sides[0]) Object.assign(wifeHotspot.approach, sides[0])
      }
    }
    // Toy blocks and a dog bowl give the room a lived-in feel.
    for (let i = 0; i < 4; i++) box(root, 2.25 + (i % 2) * .32, .14, -.6 + Math.floor(i / 2) * .36, .23, .27, .23, [C.terra, C.blue, C.yellow, C.green][i]).rotation.y = i * .3
    cylinder(root, -1.2, .11, 3.65, .34, .3, .21, C.blue); cylinder(root, -1.2, .23, 3.65, .26, .26, .01, '#a9d1cd')
    plant(root, -5.02, 0, -4.25, .85); plant(root, 5.12, 0, .35, .8)
    stairs('stairsUp', 4.15, 3.55, 'up')
    const coatRack = group(root, -3.3, -4.8); coatRack.name = 'coat-rack'
    box(coatRack, 0, 2.02, 0, 1.28, .18, .13, C.lightWood)
    for (const x of [-.45, 0, .45]) {
      box(coatRack, x, 1.94, .14, .055, .2, .055, '#536466')
      box(coatRack, x, 1.85, .2, .055, .055, .16, '#536466')
    }
    const coat = group(coatRack, -.43, .23)
    box(coat, 0, 1.39, 0, .4, .76, .16, '#b87954')
    for (const side of [-1, 1]) { const sleeve = box(coat, side*.25, 1.53, 0, .15, .48, .15, '#b87954'); sleeve.rotation.z = side*.25 }
    box(coat, 0, 1.4, .09, .025, .68, .02, '#855c46')
    box(coatRack, .45, 1.62, .23, .2, .51, .1, '#719693')
    const backDoor = group(root, -1.7, -4.88)
    box(backDoor, 0, 1.15, 0, 1.4, 2.3, .15, C.edge)
    box(backDoor, 0, 1.12, .1, 1.15, 2.12, .12, '#567a70')
    box(backDoor, 0, 1.57, .18, .77, .67, .03, '#9bcbbd')
    box(backDoor, .4, .99, .19, .09, .09, .06, C.yellow)
    box(backDoor, 0, .06, .26, 1.5, .12, .6, C.lightWood)
    hot('outside', backDoor, { x: -1.7, z: -3.75 }, 2.67)
  } else {
    neighborhood(root)
    for (let i = 0; i < 105; i++) {
      const x = Math.sin(i * 84.3) * 5.8, z = Math.cos(i * 43.7) * 4.8
      box(root, x, .023, z, .1, .035, .23, i % 2 ? '#a5bd7b' : '#859f65')
    }
    for (let i = 0; i < 25; i++) { const x = -6 + i * .5; box(root, x, .57, -4.94, .27, 1.1, .12, '#e0d1ac'); const cap = new THREE.Mesh(new THREE.ConeGeometry(.2, .2, 4), material('#e0d1ac')); cap.position.set(x, 1.21, -4.94); cap.rotation.y = Math.PI / 4; root.add(cap) }
    for (const y of [.3, .82]) box(root, 0, y, -5, 12.25, .13, .12, '#bdac86')
    for (let i = 0; i < 20; i++) box(root, -6, .57, -4.7 + i * .5, .12, 1.1, .27, '#e0d1ac')
    for (const y of [.3, .82]) box(root, -6.04, y, 0, .12, .13, 10, '#bdac86')
    // A closed perimeter, including the driveway gate. Navigation stays inside it.
    const perimeter = group(root); perimeter.name = 'closed-yard-perimeter'
    for (let i = 0; i <= 24; i++) {
      const x = -6 + i * .5
      box(perimeter, x, .38, 4.96, .12, .79, .12, '#dddac5')
    }
    for (const y of [.2, .6]) box(perimeter, 0, y, 4.96, 12.15, .09, .1, '#c3c5b0')
    for (let i = 0; i <= 20; i++) box(perimeter, 5.98, .38, -5 + i * .5, .12, .79, .12, '#dddac5')
    for (const y of [.2, .6]) box(perimeter, 5.98, y, 0, .1, .09, 10.15, '#c3c5b0')
    for (const x of [1.45, 5.4]) box(perimeter, x, .51, 4.96, .2, 1.03, .2, '#eee4ca')
    box(perimeter, 3.4, .46, 4.89, .16, .16, .05, '#687977')
    const gateBrace = box(perimeter, 3.4, .4, 4.96, 3.85, .07, .07, '#c3c5b0'); gateBrace.rotation.z = .13
    const home = group(root, -2.35, -3.55); home.name = 'house-exterior'
    box(home, 0, .17, 0, 6.25, .34, 2.92, '#8d9290')
    box(home, 0, 1.91, 0, 6.02, 3.35, 2.68, '#f3dfaa')
    for (let row = 0; row < 12; row++) box(home, 0, .48 + row * .26, 1.356, 6.03, .035, .025, '#d1b985')
    for (const x of [-2.95, 2.95]) box(home, x, 1.95, 1.39, .14, 3.42, .13, '#fff3ce')
    box(home, 0, 2.02, 1.39, 6.2, .12, .14, '#fff3ce')
    // A pitched, tiled roof and two rows of windows make both floors readable.
    const roofShape = new THREE.Shape(); roofShape.moveTo(-3.32, 0); roofShape.lineTo(0, 1.26); roofShape.lineTo(3.32, 0); roofShape.closePath()
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 3.22, bevelEnabled: false }), material('#b75653'))
    roof.position.set(0, 3.62, -1.61); roof.castShadow = true; home.add(roof)
    for (let i = 0; i < 9; i++) for (const side of [-1, 1]) {
      const x = side * (.2 + i * .37), y = 4.9 - Math.abs(x) * .379
      box(home, x, y, 0, .08, .06, 3.25, '#923f47')
    }
    box(home, 1.97, 4.53, -.47, .55, 1.16, .58, '#b77762'); box(home, 1.97, 5.13, -.47, .69, .13, .7, '#82574f')
    for (const y of [1.17, 2.83]) for (const x of [-1.98, 1.98]) {
      box(home, x, y, 1.4, 1.05, .91, .15, '#fff4d7'); box(home, x, y, 1.49, .83, .7, .04, '#7eb5bd')
      box(home, x, y, 1.53, .06, .72, .035, '#fff4d7'); box(home, x, y, 1.53, .84, .06, .035, '#fff4d7')
      for (const side of [-1, 1]) box(home, x + side * .64, y, 1.43, .19, .89, .1, '#5c8b84')
    }
    box(home, 0, 2.86, 1.43, .95, .86, .1, '#fff4d7'); box(home, 0, 2.86, 1.51, .72, .62, .04, '#7eb5bd')
    const entry = group(root, -2.35, -2.12); entry.name = 'backyard-door'
    box(entry, 0, 1.03, 0, 1.37, 2.05, .18, '#fff4d7'); box(entry, 0, .97, .12, 1.12, 1.91, .13, '#567a70')
    box(entry, 0, 1.43, .21, .73, .62, .035, '#9bcbbd'); box(entry, .39, .9, .22, .09, .09, .065, C.yellow)
    box(entry, 0, .08, .25, 1.64, .16, .64, '#b7afa0')
    obstacle(-2.35, -3.55, 6.25, 2.92); hot('inside', entry, { x: -2.35, z: -1.43 }, 2.45)
    for (let i = 0; i < 4; i++) box(root, -2.35 + i * .65, .035, -1.35, .59, .06, .58, '#e3ce9e')
    for (let i = 0; i < 6; i++) box(root, -.4, .035, -1.35 + i * .9, .85, .06, .68, '#e3ce9e')
    const tree = (x: number, z: number, scale: number) => {
      const g = group(root, x, z); g.scale.setScalar(scale); cylinder(g, 0, 1.02, 0, .17, .27, 2.05, '#8f704a', 7)
      ball(g, 0, 2.56, 0, 1.23, '#6e9661', 1); ball(g, -.62, 2.17, .21, .88, '#769f65', 1); ball(g, .63, 2.22, .05, .83, '#89aa70', 1); ball(g, .12, 3.12, -.08, .78, '#8dae74', 1); obstacle(x, z, .9, .9)
      animated.push(t => { g.rotation.z = Math.sin(t * .7 + x) * .007 })
    }
    tree(-4.95, 3.93, .66); tree(5.25, -3.92, .65)
    const garden = group(root, 2.7, -3.6)
    box(garden, 0, .22, 0, 3.2, .43, 1.05, C.edge); box(garden, 0, .45, 0, 2.99, .05, .87, '#6e6246')
    for (let i = 0; i < 8; i++) { const x = -1.28 + i * .36; cylinder(garden, x, .71, Math.sin(i) * .2, .025, .025, .55, '#4b7c48'); for (let j = 0; j < 5; j++) ball(garden, x + Math.sin(j * 1.26) * .1, 1 + Math.cos(j * 1.26) * .09, Math.sin(i) * .2, .095, i % 2 ? '#dfab79' : '#efd99b', 0); ball(garden, x, 1, Math.sin(i) * .2 + .05, .06, C.yellow, 0) }
    obstacle(2.7, -3.6, 3.2, 1.05); hot('garden', garden, { x: 2.7, z: -2.35 }, 1.65)
    const picnic = group(root, -3.35, 1.32)
    box(picnic, 0, .86, 0, 2.3, .16, 1.3, C.lightWood)
    for (let i = 1; i < 5; i++) box(picnic, 0, .952, -.65 + i * .26, 2.3, .02, .012, C.edge)
    for (const z of [-1, 1]) { box(picnic, 0, .46, z, 2.4, .15, .39, C.lightWood); for (const x of [-.8, .8]) box(picnic, x, .26, z, .15, .5, .17, C.edge) }
    for (const x of [-.79, .79]) { const leg = box(picnic, x, .43, 0, .13, .9, 1.3, C.edge); leg.rotation.z = x > 0 ? -.2 : .2 }
    plant(picnic, 0, .95, 0, .48); cylinder(picnic, .67, 1.1, .15, .1, .08, .27, C.cream)
    obstacle(-3.35, 1.32, 2.4, 2.45); hot('picnic', picnic, { x: -1.5, z: 1.3 }, 1.7)
    const tesla = group(root, 3.32, .75); tesla.rotation.y = -.1
    box(root, 3.35, .017, 1.1, 3.8, .035, 5.7, '#b5b4a1')
    tesla.name = 'electric-sedan'
    // Tapered body rings and coplanar glass avoid the old stacked-box cabin.
    const surface = (points: number[][], color: string, name = '') => {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3))
      geometry.setIndex([0, 1, 2, 0, 2, 3]); geometry.computeVertexNormals()
      const finish = material(color).clone(); finish.side = THREE.DoubleSide
      const mesh = new THREE.Mesh(geometry, finish); mesh.name = name; mesh.castShadow = true; mesh.receiveShadow = true; tesla.add(mesh); return mesh
    }
    const rings = [
      { z: -1.88, w: .78, low: .48, top: .85 },
      { z: -1.45, w: .99, low: .37, top: 1.01 },
      { z: .95, w: .99, low: .37, top: .98 },
      { z: 1.73, w: .89, low: .43, top: .79 },
      { z: 1.91, w: .73, low: .5, top: .69 },
    ]
    for (let i = 0; i < rings.length - 1; i++) {
      const a = rings[i], b = rings[i + 1]
      surface([[-a.w,a.top,a.z],[a.w,a.top,a.z],[b.w,b.top,b.z],[-b.w,b.top,b.z]], '#f4f1e7')
      for (const side of [-1, 1]) surface([[side*a.w,a.low,a.z],[side*b.w,b.low,b.z],[side*b.w,b.top,b.z],[side*a.w,a.top,a.z]], '#e6e7df')
    }
    for (const a of [rings[0], rings.at(-1)!]) surface([[-a.w,a.low,a.z],[a.w,a.low,a.z],[a.w,a.top,a.z],[-a.w,a.top,a.z]], '#eceee5')
    const backBottom = [-.86, 1.025, -1.42], backTop = [-.73, 1.49, -.66], frontTop = [-.72, 1.49, .31], frontBottom = [-.88, .997, 1.03]
    const mirror = (p: number[]) => [-p[0], p[1], p[2]]
    surface([backBottom, mirror(backBottom), mirror(backTop), backTop], '#405a60', 'rear-glass')
    surface([frontTop, mirror(frontTop), mirror(frontBottom), frontBottom], '#64888f', 'windshield')
    surface([backTop, mirror(backTop), mirror(frontTop), frontTop], '#34494f', 'glass-roof')
    for (const side of [-1, 1]) {
      const point = (p: number[]) => [Math.abs(p[0]) * side, p[1], p[2]]
      surface([point(backBottom), point(backTop), point(frontTop), point(frontBottom)], '#304c55', 'side-glass')
      // Slim pillars and white lower window trim follow the sloping cabin edges.
      const beam = (a: number[], b: number[], width: number, color: string) => {
        const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start)
        const mesh = box(tesla, ...start.clone().add(end).multiplyScalar(.5).toArray() as [number,number,number], width, delta.length(), width, color)
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), delta.normalize())
      }
      beam(point(backBottom), point(backTop), .055, '#e7e9df')
      beam(point(frontTop), point(frontBottom), .055, '#e7e9df')
      beam(point(backBottom), point(frontBottom), .055, '#f4f1e7')
      beam([side*.875,1.014,-.25], [side*.739,1.49,-.25], .045, '#253d43')
      for (const z of [-1.2, 1.19]) {
        const wheel = cylinder(tesla, side*.97, .41, z, .37, .37, .19, '#2e3739', 16); wheel.rotation.z = Math.PI / 2
        const hub = cylinder(tesla, side*1.074, .41, z, .255, .255, .025, '#566467', 10); hub.rotation.z = Math.PI / 2
        const center = cylinder(tesla, side*1.09, .41, z, .085, .085, .027, '#9ba8a7', 8); center.rotation.z = Math.PI / 2
      }
      box(tesla, side*.93, 1.02, .72, .2, .095, .24, '#e9ede3')
      for (const z of [-.71,.46]) box(tesla, side*.996, .9, z, .016, .027, .19, '#667576')
      const light = box(tesla, side*.58, .756, 1.755, .43, .045, .085, '#f8f6d7'); light.rotation.y = side*.2
      box(tesla, side*.57, .85, -1.89, .39, .06, .025, '#bd5e59')
    }
    box(tesla, 0, .52, 1.92, 1.03, .045, .018, '#4b5a5c')
    box(tesla, 0, .715, 1.91, .09, .012, .015, '#9ba8a7')
    obstacle(3.32, .75, 2.3, 4.1); hot('tesla', tesla, { x: 1.65, z: .4 }, 2.05)
    const grill = group(root, -5.1, -1.15); grill.name = 'yard-grill'
    box(grill, 0, .85, 0, .7, .45, .5, '#4a5b5b'); box(grill, 0, 1.12, 0, .75, .12, .54, '#60716b')
    box(grill, 0, 1.06, .3, .4, .04, .06, '#b8c1b1')
    for (const x of [-.24, .24]) box(grill, x, .38, 0, .055, .7, .055, '#65716c')
    obstacle(-5.1, -1.15, .75, .6)
    const hose = new THREE.Mesh(new THREE.TorusGeometry(.26, .045, 5, 14), material('#527c63')); hose.position.set(.1, .8, -2.16); root.add(hose)
    const birdbath = group(root, -2.7, 3.85); birdbath.name = 'birdbath'
    cylinder(birdbath, 0, .38, 0, .09, .18, .76, '#b7b7a2', 8)
    cylinder(birdbath, 0, .77, 0, .35, .16, .16, '#cecab1', 10); cylinder(birdbath, 0, .855, 0, .29, .29, .015, '#8bb6b5', 10)
    obstacle(-2.7, 3.85, .7, .7)
    ball(root, .75, .14, 3.65, .14, '#d5b45f', 1)
    const wateringCan = group(root, 4.65, -3.05)
    cylinder(wateringCan, 0, .2, 0, .17, .19, .37, '#749da1', 8)
    const spout = box(wateringCan, .24, .22, 0, .35, .09, .09, '#749da1'); spout.rotation.z = .5
    const charger = group(root, 5.2, -1.45); box(charger, 0, .72, 0, .14, 1.4, .16, '#758274'); box(charger, 0, 1.3, 0, .4, .57, .2, C.white); box(charger, 0, 1.32, .12, .06, .17, .02, '#7daa79')
  }
  function stairs(id: string, x: number, z: number, direction: 'up' | 'down') {
    const g = group(root, x, z)
    if (direction === 'down') {
      g.name = 'downstairs-opening'
      box(g, 0, -.58, 0, 1.75, .055, 1.9, '#3e3935')
      for (const side of [-1, 1]) {
        box(g, side * .87, -.28, 0, .08, .56, 1.9, '#77583f')
        box(g, side * .92, .035, 0, .14, .07, 2.04, C.edge)
      }
      box(g, 0, -.28, .95, 1.75, .56, .07, '#614831')
      box(g, 0, .035, .99, 1.98, .07, .14, C.edge)
      for (let i = 0; i < 6; i++) {
        const top = -.025 - i * .089
        const tread = box(g, 0, top - .045, -.79 + i * .3, 1.62, .09, .29, ['#d2a975', '#c39a68', '#b58a5d', '#a17952', '#8f6847', '#79573c'][i]); tread.name = 'descending-tread'
      }
    } else {
      box(g, 0, .025, 0, 1.8, .04, 1.9, '#675745')
      for (let i = 0; i < 6; i++) { const h = .12 + i * .19; box(g, 0, h / 2, .75 - i * .3, 1.55, h, .29, '#cda477') }
      for (const side of [-1, 1]) {
        box(g, side * .89, .48, -.61, .1, .95, .1, C.edge); box(g, side * .89, .27, .7, .1, .54, .1, C.edge)
        const rail = box(g, side * .89, .69, .04, .1, .1, 1.52, C.edge); rail.rotation.x = .26
      }
    }
    obstacle(x, z, 1.85, 1.95); hot(id, g, { x, z: z - 1.5 }, 1.6)
  }
  return { root, obstacles, hotspots, animated, update, spawn: room === 'upstairs' ? { x: -1.7, z: .5 } : room === 'downstairs' ? { x: -.9, z: 2.9 } : { x: -2.35, z: -1.35 } }
}
// Materials are shared between floors. Dispose only when the entire experience ends.
export function disposeMaterials() { materials.forEach(m => m.dispose()); materials.clear() }

/** Decorative surroundings live outside the fixed, yard-only navigation bounds. */
function neighborhood(parent: THREE.Group) {
  const district = group(parent); district.name = 'suburban-nj-neighborhood'
  box(district, 0, -.42, 0, 48, .34, 44, '#86a475')
  // Quiet residential streets, concrete curbs, grass verges and jointed sidewalks.
  box(district, 0, -.205, 8.3, 48, .06, 4, '#697274')
  box(district, 10.2, -.205, 0, 3.8, .06, 44, '#697274')
  for (const z of [6.23, 10.37]) box(district, 0, -.15, z, 48, .17, .15, '#bfc5bc')
  for (const x of [8.2, 12.2]) box(district, x, -.15, 0, .15, .17, 44, '#bfc5bc')
  for (const z of [5.65, 10.95]) {
    box(district, 0, -.17, z, 48, .1, .88, '#cdd0bf')
    for (let x = -23; x <= 23; x += 1.1) box(district, x, -.112, z, .022, .01, .88, '#a7afa5')
  }
  for (const x of [7.5, 12.9]) {
    box(district, x, -.17, 0, .8, .1, 44, '#cdd0bf')
    for (let z = -21; z < 22; z += 1.1) box(district, x, -.112, z, .8, .01, .022, '#a7afa5')
  }
  for (let x = -24; x < 24; x += 3) if (x < 7 || x > 12) {
    for (const z of [8.22, 8.38]) box(district, x, -.168, z, 1.45, .012, .045, '#e5d5a0')
  }
  for (let i = 0; i < 6; i++) box(district, 7.1 + i * .5, -.16, 6.75, .28, .02, .8, '#e8e7cf')
  for (const x of [-7, 6.5, 13.5]) {
    box(district, x, -.105, 6.14, .58, .035, .3, '#4c595b')
    for (let i = 0; i < 5; i++) box(district, x - .22 + i * .11, -.08, 6.14, .035, .012, .25, '#85918f')
  }
  const shrub = (x: number, z: number, color = '#5b845b') => {
    ball(district, x, .25, z, .44, color, 0).scale.set(1.2, .8, 1)
  }
  const tree = (x: number, z: number, size: number, autumn = false, evergreen = false) => {
    const t = group(district, x, z); t.scale.setScalar(size)
    cylinder(t, 0, 1.1, 0, .13, .23, 2.4, '#80694f', 7)
    if (evergreen) {
      for (let i = 0; i < 3; i++) {
        const crown = new THREE.Mesh(new THREE.ConeGeometry(1.1 - i * .22, 1.7, 7), material(i % 2 ? '#527b67' : '#436b5c'))
        crown.position.y = 1.65 + i * .65; crown.castShadow = true; t.add(crown)
      }
    } else {
      for (const [x, y, z, r] of [[0, 2.9, 0, 1.25], [-.7, 2.5, .25, .85], [.7, 2.65, -.2, .95], [.1, 3.7, -.1, .8]]) ball(t, x, y, z, r, autumn ? '#b69558' : (x < 0 ? '#6e965f' : '#7da268'), 1)
    }
    cylinder(t, 0, -.13, 0, .75, .75, .035, '#7d7759', 12)
  }
  const house = (x: number, z: number, width: number, height: number, color: string, roofColor: string, facing = 0, porch = false) => {
    const h = group(district, x, z); h.name = 'neighbor-house'; h.rotation.y = facing
    box(h, 0, .03, 0, width + .3, .42, 3.7, '#8e9690')
    box(h, 0, height / 2 + .2, 0, width, height, 3.5, color)
    for (let i = 0; i < height / .27; i++) box(h, 0, .35 + i * .27, 1.765, width, .025, .018, '#ffffff')
    const shape = new THREE.Shape(); shape.moveTo(-width / 2 - .25, 0); shape.lineTo(0, 1.35); shape.lineTo(width / 2 + .25, 0); shape.closePath()
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: false }), material(roofColor)); roof.position.set(0, height + .23, -2); roof.castShadow = true; h.add(roof)
    box(h, width * .29, height + 1.05, -.5, .52, 1.4, .55, '#a57865')
    box(h, width * .29, height + 1.79, -.5, .65, .12, .66, '#d0c9b6')
    const window = (x: number, y: number) => {
      box(h, x, y, 1.81, .94, .93, .13, '#f3edd8'); box(h, x, y, 1.89, .73, .72, .025, '#8ab6bd')
      box(h, x, y, 1.92, .04, .75, .025, '#f3edd8'); box(h, x, y, 1.92, .75, .04, .025, '#f3edd8')
      for (const side of [-1, 1]) box(h, x + side * .59, y, 1.81, .18, .91, .09, '#4e6e73')
    }
    for (const x of [-width * .3, width * .3]) { window(x, 1.24); if (height > 3) window(x, 2.95) }
    box(h, 0, 1.12, 1.8, .85, 1.84, .12, '#f0e9d4'); box(h, 0, 1.08, 1.89, .67, 1.69, .09, porch ? '#a9634e' : '#4a7779')
    box(h, 0, 1.51, 1.945, .43, .43, .025, '#98b8b9'); ball(h, .22, .99, 1.97, .035, C.yellow, 0)
    for (let i = 0; i < 2; i++) box(h, 0, .05 + i * .08, 2.3 - i * .2, 1.35, .14, .7, '#b8b9a7')
    if (porch) {
      box(h, 0, .17, 2.3, width - .25, .16, 1.2, '#b1b5ab')
      box(h, 0, 2.25, 2.3, width, .16, 1.3, '#e9e4d2')
      for (const x of [-width / 2 + .3, width / 2 - .3]) box(h, x, 1.2, 2.75, .13, 2, .13, '#f0ead9')
      for (const x of [-width * .3, width * .3]) { box(h, x, .59, 2.43, .48, .12, .48, '#526f69'); box(h, x, .91, 2.2, .48, .61, .1, '#526f69') }
    }
    for (const side of [-1, 1]) {
      box(h, side * (width / 2 - .04), height / 2 + .2, 1.8, .09, height, .08, '#eee9d8')
      ball(h, side * width * .35, .4, 2.9, .47, '#678960', 0)
    }
  }
  // Colonial, Cape and ranch silhouettes, with different siding, porches and lots.
  house(-10.7, -.6, 4.5, 3.6, '#c3c4b5', '#666d77', 0, true)
  house(-10, -9, 4.7, 2.35, '#b6c5c0', '#746b60')
  house(-2.2, -10.8, 5.2, 3.65, '#b7a48d', '#5e7277', 0, true)
  house(5.3, -10.1, 4.3, 2.4, '#bd8671', '#65646a')
  house(-9.5, 14, 4.7, 2.5, '#d4c4a0', '#71675c', Math.PI, true)
  house(-1.5, 14, 5.1, 3.65, '#b6c6cd', '#646e7c', Math.PI)
  house(15.2, -5.4, 4.3, 3.5, '#c9c5aa', '#7b6760', Math.PI / 2, true)
  // The next row of lots comes into view only as the camera pulls back.
  house(-20, -5, 4.5, 2.4, '#b6c5c0', '#746b60', 0, true)
  house(-19, 14, 4.7, 3.5, '#bd8671', '#65646a', Math.PI)
  house(17.3, 13.6, 4.8, 2.5, '#d4c4a0', '#71675c', Math.PI, true)
  house(2, -18.5, 4.9, 3.6, '#b6c6cd', '#646e7c')
  for (const [x, z] of [[-22, 2], [-19, -13], [-13, -18], [-5, -19], [8, -18], [18, -14], [20, 4], [21, 18], [5, 19], [-12, 19]]) tree(x, z, 1.1, x === 5, x === -19 || x === 18)
  for (const [x, z, size] of [[-15, 2, 1.2], [-14, -7, 1.1], [-6.5, -10, 1.2], [2, -7.9, .85], [6.7, -5.9, .9], [-14, 12, 1], [4, 13, 1.1], [14, 2.8, 1]]) tree(x, z, size, x === 4, x === -6.5 || x === 14)
  for (let i = 0; i < 10; i++) shrub(-6.9, -4.4 + i * .65)
  for (let i = 0; i < 9; i++) shrub(-5.5 + i * 1.3, -6.9, i % 2 ? '#759765' : '#598064')
  // Driveways, a detached garage, curbside mailboxes and recycling bins.
  box(district, -14, -.11, 1.5, 2.2, .04, 7.3, '#a3aaa3')
  box(district, -14, .85, -3.5, 2.65, 1.95, 2.7, '#c3c4b5')
  box(district, -14, 1.87, -3.5, 2.95, .2, 3, '#666d77')
  box(district, -14, .79, -2.12, 2.18, 1.67, .06, '#e4e3d5')
  for (let i = 0; i < 6; i++) box(district, -14, .15 + i * .26, -2.077, 2.18, .025, .02, '#9ba9a6')
  for (const x of [-10.5, -3, 5.7]) {
    box(district, x, .43, 5.13, .1, 1.1, .1, '#7e6852')
    box(district, x, 1.04, 5.13, .48, .32, .6, '#536972')
    box(district, x + .26, 1.11, 5.17, .035, .21, .06, '#bd6855')
    box(district, x, 1.03, 5.45, .2, .04, .016, '#e7dbc0')
  }
  for (const [x, color] of [[-12, '#527863'], [-11.5, '#527b93']] as const) {
    box(district, x, .31, 4.65, .37, .69, .42, color); box(district, x, .68, 4.65, .43, .08, .47, '#435c60')
    for (const side of [-1, 1]) ball(district, x + side * .16, .015, 4.5, .08, '#394748', 0)
  }
  // Hydrant, street blades, lamps and a basketball hoop.
  cylinder(district, 6.6, .24, 6, .12, .16, .65, '#b8644f', 8)
  ball(district, 6.6, .62, 6, .17, '#ba6d52', 0); box(district, 6.6, .36, 6, .5, .12, .14, '#b8644f')
  cylinder(district, 7.2, 1.2, 5.1, .035, .035, 2.7, '#677778', 8)
  box(district, 7.2, 2.4, 5.1, 1.2, .23, .06, '#42776a'); box(district, 7.2, 2.67, 5.1, .06, .23, 1.2, '#42776a')
  for (let i = 0; i < 6; i++) box(district, 6.81 + i * .14, 2.4, 5.14, .07, .05, .012, '#eee8d0')
  for (const x of [-7.1, 13.1]) {
    cylinder(district, x, 1.55, 5.3, .055, .08, 3.4, '#556568', 8)
    box(district, x, 3.28, 5.55, .08, .08, .56, '#556568'); box(district, x, 3.22, 5.83, .34, .13, .55, '#e1d7a9')
  }
  box(district, -14.8, 1.25, .4, .07, 2.7, .07, '#586668'); box(district, -14.8, 2.6, .4, 1, .67, .08, '#e0e4da')
  box(district, -14.8, 2.53, .45, .41, .28, .02, '#bb765e')
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(.23, .025, 4, 12), material('#bd7656')); hoop.rotation.x = Math.PI / 2; hoop.position.set(-14.8, 2.32, .7); district.add(hoop)
  // A bicycle resting near the sidewalk.
  for (const x of [-9.3, -8.35]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(.3, .045, 5, 12), material('#465655')); wheel.position.set(x, .2, 4.25); district.add(wheel)
  }
  for (const [x, angle] of [[-9.02, -.55], [-8.65, .55], [-8.42, -.25]]) { const frame = box(district, x, .43, 4.25, .045, .65, .045, '#b66852'); frame.rotation.z = angle }
  box(district, -8.95, .76, 4.25, .3, .06, .15, '#485553'); box(district, -8.32, .83, 4.25, .25, .04, .05, '#485553')
  // Merge static scenery by material to keep a rich block inexpensive to render.
  district.updateMatrixWorld(true)
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>()
  district.traverse(object => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return
    const geometry = (object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone()).applyMatrix4(object.matrixWorld)
    const batch = batches.get(object.material) || []; batch.push(geometry); batches.set(object.material, batch)
    object.geometry.dispose()
  })
  district.clear()
  for (const [finish, geometries] of batches) {
    const geometry = mergeGeometries(geometries, false)
    geometries.forEach(g => g.dispose())
    if (!geometry) continue
    const mesh = new THREE.Mesh(geometry, finish); mesh.castShadow = true; mesh.receiveShadow = true; district.add(mesh)
  }
}
