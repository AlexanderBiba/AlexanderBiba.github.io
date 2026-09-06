import * as THREE from 'three'

/** Collect the visible silhouette once; distant scenery never sets the starting zoom. */
export function framingPoints(root: THREE.Object3D) {
  const points: THREE.Vector3[] = []
  root.updateMatrixWorld(true)
  function collect(object: THREE.Object3D) {
    if (object.userData.excludeFromFrame) return
    if (object instanceof THREE.Mesh && !object.userData.hotspot) {
      // Geometry vertices avoid the empty corners of one large room bounding box.
      const positions = object.geometry.getAttribute('position')
      for (let i = 0; i < positions.count; i++) points.push(new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld))
    }
    object.children.forEach(collect)
  }
  collect(root)
  return points
}

/** Fill 98% of the available dimension while keeping the full room in view. */
export function fitRoomCamera(camera: THREE.OrthographicCamera, points: THREE.Vector3[], aspect: number, zoom: number) {
  camera.updateMatrixWorld(true)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  const p = new THREE.Vector3()
  for (const point of points) {
    p.copy(point).applyMatrix4(camera.matrixWorldInverse)
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
  }
  const span = Math.max(maxY - minY, (maxX - minX) / aspect) / .98 / zoom
  const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2
  camera.left = centerX - span * aspect / 2; camera.right = centerX + span * aspect / 2
  camera.top = centerY + span / 2; camera.bottom = centerY - span / 2
  camera.updateProjectionMatrix()
}
