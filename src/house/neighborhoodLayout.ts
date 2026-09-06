// Lots are planned with the streets, so every entrance and driveway has frontage.
export const ROAD_WIDTH = 4.4
export const ROAD_X = [-54, -22, 10, 42]
export const ROAD_Z = [-38, -15, 8, 31]
export const HOUSE_WIDTH = 6.02
export const HOUSE_DEPTH = 5.4
export const LOT_WIDTH = 12
export const LOT_DEPTH = 17
export const DISTRICT = { minX: -58, maxX: 46, minZ: -42, maxZ: 35 }

export const neighborhoodLots = ROAD_X.slice(0, -1).flatMap((left, column) =>
  ROAD_Z.slice(0, -1).flatMap((back, row) => [0, 1].map(side => {
    const x = left + 9 + side * 13, z = back + 11.5
    const player = x === 0 && z === -3.5
    const direction = player || (column + row + side) % 2 === 0 ? -1 : 1
    return {
      x, z, player, direction, streetZ: direction < 0 ? back : ROAD_Z[row + 1],
      houseX: x - 2.35, houseZ: z + direction * 1.41,
      facing: direction < 0 ? Math.PI : 0,
      variant: column * 6 + row * 2 + side,
    }
  }))
)
