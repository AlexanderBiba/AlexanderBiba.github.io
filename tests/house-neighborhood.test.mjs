import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { buildWorld } from '../src/house/world.ts'
import { fitRoomCamera } from '../src/house/framing.ts'
import { ROAD_X, ROAD_Z, ROAD_WIDTH, HOUSE_WIDTH, HOUSE_DEPTH, LOT_WIDTH, LOT_DEPTH, neighborhoodLots } from '../src/house/neighborhoodLayout.ts'

const yard = buildWorld('backyard')
yard.root.updateMatrixWorld(true)
const district = yard.root.getObjectByName('suburban-nj-neighborhood')
function surfaceAt(x, z) {
  const ray = new THREE.Raycaster(new THREE.Vector3(x, 12, z), new THREE.Vector3(0, -1, 0))
  return ray.intersectObject(district, true)[0]
}

test('intersections have uninterrupted asphalt and four complete crossings', () => {
  for (const x of ROAD_X) for (const z of ROAD_Z) {
    for (const [dx, dz] of [[0, 0], [-1.7, 0], [1.7, 0], [0, -1.7], [0, 1.7]]) {
      const hit = surfaceAt(x + dx, z + dz)
      assert.equal(hit.object.material.color.getHexString(), '697274', 'no sidewalk or curb runs through an intersection')
    }
  }
  for (const side of [-1, 1]) for (let stripe = 0; stripe < 9; stripe++) {
    const offset = (stripe - 4) * .49
    for (const [x, z] of [[10 + side * 3.4, 8 + offset], [10 + offset, 8 + side * 3.4]]) {
      const hit = surfaceAt(x, z)
      assert.equal(hit.object.material.color.getHexString(), 'eee9d6', 'crosswalk paint reaches both sides of both lanes')
    }
  }
})

test('every lot has separate front and back lawns, street frontage and no road overlap', () => {
  assert.ok(ROAD_X.length >= 3 && ROAD_Z.length >= 3, 'roads form a grid of blocks')
  assert.equal(neighborhoodLots.filter(lot => lot.player).length, 1)
  for (const lot of neighborhoodLots) {
    const front = lot.houseZ + lot.direction * HOUSE_DEPTH / 2
    const back = lot.houseZ - lot.direction * HOUSE_DEPTH / 2
    const frontFence = lot.z + lot.direction * LOT_DEPTH / 2
    const backFence = lot.z - lot.direction * LOT_DEPTH / 2
    assert.ok((frontFence - front) * lot.direction > 3, 'usable front lawn')
    assert.ok((back - backFence) * lot.direction > 5, 'usable back lawn')
    assert.ok(Math.cos(lot.facing) * (lot.streetZ - lot.houseZ) > 0, 'front door faces its bordering street')
    for (const x of ROAD_X) assert.ok(Math.abs(lot.x - x) >= LOT_WIDTH / 2 + ROAD_WIDTH / 2)
    for (const z of ROAD_Z) assert.ok(Math.abs(lot.z - z) >= LOT_DEPTH / 2 + ROAD_WIDTH / 2)
    for (const other of neighborhoodLots.filter(other => other !== lot)) {
      assert.ok(Math.abs(lot.x - other.x) >= LOT_WIDTH || Math.abs(lot.z - other.z) >= LOT_DEPTH, 'properties never overlap')
    }
  }
})

test('every neighboring house has a parked car alongside it', () => {
  for (const lot of neighborhoodLots.filter(lot => !lot.player)) {
    const hit = surfaceAt(lot.x + 3.35, lot.houseZ + lot.direction * .8)
    assert.ok(hit.point.y > 1.2 && hit.point.y < 1.5, 'ray lands on a car roof in the driveway')
  }
})

test('Alex has the same house footprint as the neighbors without moving the backyard facade', () => {
  const shell = yard.root.getObjectByName('home-shell')
  assert.equal(shell.geometry.parameters.width, HOUSE_WIDTH)
  assert.equal(shell.geometry.parameters.depth, HOUSE_DEPTH)
  const doorway = yard.hotspots.find(h => h.id === 'inside')
  assert.equal(doorway.group.position.x, -2.35)
  assert.equal(doorway.group.position.z, -2.12)
  const front = yard.root.getObjectByName('street-facing-front-door')
  const frontPosition = front.getWorldPosition(new THREE.Vector3())
  assert.ok(frontPosition.z < -7.5, 'the front elevation is on the other side of the deeper house')
  assert.ok(front.getWorldDirection(new THREE.Vector3()).z < -.99, 'front entrance faces the street at z = -15')
})

test('starting views fit closely without cropping on portrait, landscape or wide windows', () => {
  for (const room of ['upstairs', 'downstairs', 'backyard']) {
    const world = room === 'backyard' ? yard : buildWorld(room)
    const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, .1, 200)
    camera.position.set(16, 16, 16); camera.lookAt(0, room === 'backyard' ? 1.2 : .6, 0)
    for (const aspect of [.55, 1, 1.8, 2.8]) {
      fitRoomCamera(camera, world.frame, aspect, 1)
      let edge = 0
      for (const point of world.frame) {
        const projected = point.clone().project(camera)
        assert.ok(Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1, `${room}: all room geometry remains in view`)
        edge = Math.max(edge, Math.abs(projected.x), Math.abs(projected.y))
      }
      assert.ok(edge > .97, `${room}: outline reaches the window edge with only a small margin`)
      const startingWidth = camera.right - camera.left
      fitRoomCamera(camera, world.frame, aspect, .5)
      assert.ok(camera.right - camera.left >= startingWidth * 1.99, 'zooming out reveals more surroundings')
    }
  }
})
