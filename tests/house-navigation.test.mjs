import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findPath, walkable, interactionDistance, canInteract, interactionPath, isMovementKey } from '../src/house/navigation.ts'
import { buildWorld, disposeMaterials } from '../src/house/world.ts'

for (const room of ['upstairs', 'downstairs', 'backyard']) {
  test(`${room}: every story and exit is reachable without crossing furniture`, () => {
    const world = buildWorld(room)
    assert.ok(walkable(world.spawn, world.obstacles), 'spawn is on a clear floor tile')
    for (const target of world.hotspots) {
      assert.ok(walkable(target.approach, world.obstacles), `${target.id} has a clear interaction point`)
      for (const start of [world.spawn, ...world.hotspots.map(h => h.approach)]) {
        const path = findPath(start, target.approach, world.obstacles)
        const end = path.at(-1) || start
        assert.ok(Math.hypot(end.x - target.approach.x, end.z - target.approach.z) < .6, `${target.id} is reachable from ${JSON.stringify(start)}`)
        let previous = start
        for (const point of path) {
          for (let step = 1; step <= 5; step++) {
            const sample = { x: previous.x + (point.x - previous.x) * step / 5, z: previous.z + (point.z - previous.z) * step / 5 }
            assert.ok(walkable(sample, world.obstacles), `path to ${target.id} avoids furniture`)
          }
          previous = point
        }
      }
    }
    world.root.traverse(object => { if (object.geometry) object.geometry.dispose() })
    disposeMaterials()
  })
}
test('navigation respects floor bounds and cannot cross a sealed barrier', () => {
  assert.equal(walkable({ x: 7, z: 0 }, []), false)
  assert.equal(walkable({ x: 0, z: -6 }, []), false)
  assert.deepEqual(findPath({ x: -3, z: 0 }, { x: 3, z: 0 }, [{ x: 0, z: 0, w: 1, d: 12 }]), [])
})

test('the baby has an unobstructed face from the isometric camera', async () => {
  const THREE = await import('three')
  const world = buildWorld('downstairs')
  world.root.updateMatrixWorld(true)
  const baby = world.hotspots.find(h => h.id === 'baby')
  const face = world.root.getObjectByName('baby-face')
  assert.ok(face, 'baby has a distinct head and face')
  const target = face.getWorldPosition(new THREE.Vector3())
  const direction = new THREE.Vector3(1, 1, 1).normalize()
  const ray = new THREE.Raycaster(target.clone().addScaledVector(direction, 50), direction.negate())
  const first = ray.intersectObject(world.root, true)[0]
  assert.equal(first.object, face, 'crib rails and furniture do not cover the baby')
  assert.ok(target.y > .7, 'face is above the floor')
  assert.ok(baby.group.getObjectByName('baby-face'), 'clicking the face belongs to the baby interaction')
})

test('the backyard door belongs to a solid house and opens onto a clear path', () => {
  const world = buildWorld('backyard')
  assert.ok(world.root.getObjectByName('house-exterior'))
  const door = world.hotspots.find(h => h.id === 'inside')
  assert.equal(door.group.name, 'backyard-door')
  assert.equal(walkable({ x: -2.35, z: -3.55 }, world.obstacles), false, 'cannot walk through the house')
  assert.ok(walkable(door.approach, world.obstacles))
  assert.ok(Math.hypot(world.spawn.x - door.approach.x, world.spawn.z - door.approach.z) < .6, 'arrive at the back door')
})

test('upstairs stairs are visible below an actual opening in the floor', async () => {
  const THREE = await import('three'), world = buildWorld('upstairs')
  world.root.updateMatrixWorld(true)
  const opening = world.root.getObjectByName('downstairs-opening')
  assert.ok(opening)
  const heights = []
  for (let i = 0; i < 6; i++) {
    const ray = new THREE.Raycaster(new THREE.Vector3(4.15, 5, 3.55 - .79 + i * .3), new THREE.Vector3(0, -1, 0))
    const markers = new Set(world.hotspots.map(h => h.marker))
    const first = ray.intersectObject(world.root, true).find(hit => !markers.has(hit.object))
    assert.equal(first.object.name, 'descending-tread', 'floor geometry does not cover the steps')
    assert.ok(first.point.y < 0, 'steps sit below the floor')
    heights.push(first.point.y)
  }
  assert.ok(heights.every((height, i) => !i || height < heights[i - 1]), 'steps get progressively deeper')
})

test('dog patrol moves with its interaction and collision bounds, then waits to be petted', () => {
  const world = buildWorld('downstairs'), dog = world.hotspots.find(h => h.id === 'dog')
  const start = dog.group.position.clone(), farPlayer = { x: 5, z: -4.4 }
  const dogBounds = world.obstacles.find(o => o.x === start.x && o.z === start.z)
  let maxDistance = 0
  for (let frame = 0; frame < 1800; frame++) {
    world.update(1 / 30, frame / 30, farPlayer, null)
    maxDistance = Math.max(maxDistance, dog.group.position.distanceTo(start))
    assert.equal(dogBounds.x, dog.group.position.x)
    assert.equal(dog.marker.position.z, dog.group.position.z)
    assert.ok(walkable(dog.approach, world.obstacles), 'petting position remains clear')
    assert.ok(walkable(dog.group.position, world.obstacles.filter(o => o !== dogBounds), .6), 'dog avoids furniture')
  }
  assert.ok(maxDistance > 2, 'dog explores the room')
  const stopped = dog.group.position.clone(), approach = { ...dog.approach }
  for (let frame = 0; frame < 120; frame++) world.update(1 / 30, 60 + frame / 30, farPlayer, 'dog')
  assert.ok(dog.group.position.equals(stopped), 'clicking the dog stops its patrol')
  assert.deepEqual(dog.approach, approach, 'click-to-walk target stays still')
})

test('wife patrol avoids furniture and stops for conversation', () => {
  const world = buildWorld('downstairs'), wife = world.hotspots.find(h => h.id === 'wife')
  const start = wife.group.position.clone(), farPlayer = { x: 5, z: -4.4 }
  const wifeBounds = world.obstacles.find(o => o.x === start.x && o.z === start.z)
  let maxDistance = 0
  for (let frame = 0; frame < 1800; frame++) {
    world.update(1 / 30, frame / 30, farPlayer, null)
    maxDistance = Math.max(maxDistance, wife.group.position.distanceTo(start))
    assert.equal(wifeBounds.x, wife.group.position.x)
    assert.equal(wife.marker.position.z, wife.group.position.z)
    assert.ok(walkable(wife.approach, world.obstacles), 'conversation position remains clear')
    assert.ok(walkable(wife.group.position, world.obstacles.filter(o => o !== wifeBounds), .6), 'wife avoids furniture')
  }
  assert.ok(maxDistance > 1.5, 'wife explores the room')
  const stopped = wife.group.position.clone(), approach = { ...wife.approach }
  for (let frame = 0; frame < 120; frame++) world.update(1 / 30, 60 + frame / 30, farPlayer, 'wife')
  assert.ok(wife.group.position.equals(stopped), 'clicking the wife stops its patrol')
  assert.deepEqual(wife.approach, approach, 'click-to-walk target stays still')
})


test('people, dog, stairs, and car can be activated from every accessible side', () => {
  for (const room of ['upstairs', 'downstairs', 'backyard']) {
    const world = buildWorld(room)
    for (const target of world.hotspots.filter(h => h.zone)) {
      const { x, z } = target.group.position, { w, d } = target.zone
      const sides = [{ x: x - w / 2 - .55, z }, { x: x + w / 2 + .55, z }, { x, z: z - d / 2 - .55 }, { x, z: z + d / 2 + .55 }]
      for (const point of sides.filter(p => walkable(p, world.obstacles))) {
        assert.ok(interactionDistance(point, target) < .95, `${target.id} responds on side ${JSON.stringify(point)}`)
      }
      const path = interactionPath(world.spawn, target, world.obstacles)
      assert.ok(path.length || interactionDistance(world.spawn, target) < .95, `${target.id} has a reachable interaction path`)
      if (path.length) assert.ok(interactionDistance(path.at(-1), target) < .85)
    }
  }
})

test('only arrow keys move the player', () => {
  for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) assert.ok(isMovementKey(key))
  for (const key of ['w', 'a', 's', 'd', 'W', 'E', 'Escape']) assert.equal(isMovementKey(key), false)
})

test('doors, stairs, and objects share reachable activation points', () => {
  for (const room of ['upstairs', 'downstairs', 'backyard']) {
    const world = buildWorld(room)
    for (const target of world.hotspots) {
      const path = interactionPath(world.spawn, target, world.obstacles)
      assert.ok(canInteract(path.at(-1) ?? world.spawn, target), `${target.id}: clicking reaches the same range used by E`)
      assert.equal(canInteract({ x: 30, z: 30 }, target), false)
    }
  }
})
