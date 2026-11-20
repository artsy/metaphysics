import { distance } from "lib/geospatial"

describe("distance", () => {
  it("calculates the haversine distance between two points", () => {
    const newYork = { lat: 40.71427, lng: -74.00597 }
    const london = { lat: 51.50853, lng: -0.12574 }
    const expectedDistance = 5570214 // meters, rounded

    const roundedDistance = Math.round(distance(newYork, london))

    expect(roundedDistance).toEqual(expectedDistance)
  })
})
