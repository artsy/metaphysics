import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { TCity } from "schema/v2/city"

const LONDON: TCity = {
  slug: "london-united-kingdom",
  name: "London",
  full_name: "London, United Kingdom",
  coords: [51.5074, -0.1278],
}

const DUBAI: TCity = {
  slug: "dubai-united-arab-emirates",
  name: "Dubai",
  full_name: "Dubai, United Arab Emirates",
  coords: [25.2048, 55.2708],
}

describe("City.neighborhoods", () => {
  const context = {
    geodataCitiesLoader: () => Promise.resolve([LONDON, DUBAI]),
  }

  it("returns the city's neighborhoods in display order", async () => {
    const { city } = await runQuery(
      gql`
        {
          city(slug: "london-united-kingdom") {
            neighborhoods {
              slug
              name
            }
          }
        }
      `,
      context
    )

    expect(city.neighborhoods.slice(0, 3)).toEqual([
      { slug: "mayfair", name: "Mayfair" },
      { slug: "st-jamess", name: "St James's" },
      { slug: "soho", name: "Soho" },
    ])
    expect(city.neighborhoods).toHaveLength(11)
  })

  it("returns an empty list for a city with no table", async () => {
    const { city } = await runQuery(
      gql`
        {
          city(slug: "dubai-united-arab-emirates") {
            neighborhoods {
              slug
            }
          }
        }
      `,
      context
    )

    expect(city.neighborhoods).toEqual([])
  })
})

describe("Location.cityGuideNeighborhood", () => {
  const query = gql`
    {
      show(id: "a-show") {
        location {
          cityGuideNeighborhood {
            slug
            name
          }
        }
      }
    }
  `

  const neighborhoodFor = async (
    location: Record<string, unknown>,
    cities: TCity[] = [LONDON]
  ) => {
    const geodataCitiesLoader = jest.fn(() => Promise.resolve(cities))
    const { show } = await runQuery(query, {
      showLoader: () =>
        Promise.resolve({ id: "a-show", displayable: true, location }),
      geodataCitiesLoader,
    })
    return {
      neighborhood: show.location.cityGuideNeighborhood,
      geodataCitiesLoader,
    }
  }

  it("matches the postcode within the location's City Guide city", async () => {
    const { neighborhood } = await neighborhoodFor({
      coordinates: { lat: 51.51, lng: -0.14 },
      postal_code: "W1S 1HP",
    })

    expect(neighborhood).toEqual({ slug: "mayfair", name: "Mayfair" })
  })

  it("finds the city by name when there are no coordinates", async () => {
    const { neighborhood } = await neighborhoodFor({
      city: "London",
      postal_code: "EC1M 5RR",
    })

    expect(neighborhood).toEqual({ slug: "farringdon", name: "Farringdon" })
  })

  it("returns null outside a City Guide city", async () => {
    const { neighborhood } = await neighborhoodFor({
      coordinates: { lat: 40.7, lng: -74.0 },
      city: "New York",
      postal_code: "10011",
    })

    expect(neighborhood).toBeNull()
  })

  it("returns null in a City Guide city with no table", async () => {
    const { neighborhood } = await neighborhoodFor(
      { coordinates: { lat: 25.2, lng: 55.27 }, postal_code: "0000" },
      [LONDON, DUBAI]
    )

    expect(neighborhood).toBeNull()
  })

  it("returns null for a postcode the table doesn't list", async () => {
    const { neighborhood } = await neighborhoodFor({
      coordinates: { lat: 51.51, lng: -0.14 },
      postal_code: "NW10 5ES",
    })

    expect(neighborhood).toBeNull()
  })

  it("returns null without looking up the city when there is no postcode", async () => {
    const { neighborhood, geodataCitiesLoader } = await neighborhoodFor({
      coordinates: { lat: 51.51, lng: -0.14 },
      postal_code: " ",
    })

    expect(neighborhood).toBeNull()
    expect(geodataCitiesLoader).not.toHaveBeenCalled()
  })

  it("resolves on a fair's location too", async () => {
    const { fair } = await runQuery(
      gql`
        {
          fair(id: "a-fair") {
            location {
              cityGuideNeighborhood {
                slug
              }
            }
          }
        }
      `,
      {
        fairLoader: () =>
          Promise.resolve({
            id: "a-fair",
            location: {
              coordinates: { lat: 51.53, lng: -0.15 },
              postal_code: "NW1 4RY",
            },
          }),
        geodataCitiesLoader: () => Promise.resolve([LONDON]),
      }
    )

    expect(fair.location.cityGuideNeighborhood).toEqual({
      slug: "north-london",
    })
  })
})
