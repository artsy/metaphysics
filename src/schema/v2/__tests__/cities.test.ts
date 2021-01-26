import gql from "lib/gql"
import { TCity } from "../city"
import { runQuery } from "../test/utils"

const MOCK_CITIES: TCity[] = [
  {
    slug: "sacramende-ca-usa",
    name: "Sacramende",
    full_name: "Sacramende, CA, USA",
    coords: [38.5, -121.8],
  },
  {
    slug: "smallvile-usa",
    name: "Smallville",
    full_name: "Smallville, USA",
    coords: [39.78, -100.45],
  },
]

const MOCK_CONTEXT = {
  geodataCitiesLoader: () => Promise.resolve(MOCK_CITIES),
  geodataFeaturedCitiesLoader: () => Promise.resolve([MOCK_CITIES[1]]),
}

describe("cities", () => {
  it("returns all the cities", async () => {
    const query = gql`
      {
        cities {
          name
          coordinates {
            lat
            lng
          }
        }
      }
    `

    const result = await runQuery(query, MOCK_CONTEXT)

    expect(result.cities).toHaveLength(2)
    expect(result.cities[0]).toEqual({
      name: "Sacramende",
      coordinates: {
        lat: 38.5,
        lng: -121.8,
      },
    })
  })

  it("accepts an argument to return only featured cities", async () => {
    const query = gql`
      {
        cities(featured: true) {
          name
          coordinates {
            lat
            lng
          }
        }
      }
    `

    const result = await runQuery(query, MOCK_CONTEXT)

    expect(result.cities).toHaveLength(1)
    expect(result.cities[0]).toEqual({
      name: "Smallville",
      coordinates: {
        lat: 39.78,
        lng: -100.45,
      },
    })
  })
})
