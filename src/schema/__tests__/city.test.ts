import { runQuery } from "test/utils"
import gql from "lib/gql"

const mockCities = {
  "sacramende-ca-usa": {
    slug: "sacramende-ca-usa",
    name: "Sacramende",
    coordinates: { lat: 38.5, lng: -121.8 },
  },
  "smallville-usa": {
    slug: "smallvile-usa",
    name: "Smallville",
    coordinates: { lat: 39.78, lng: -100.45 },
  },
}

beforeEach(() => {
  jest.mock("../city/city_data.json", () => mockCities)
})

describe("City", () => {
  it("finds a city by its slug", () => {
    const query = gql`
      {
        city(slug: "sacramende-ca-usa") {
          name
        }
      }
    `

    return runQuery(query).then(result => {
      expect(result!.city).toEqual({
        name: "Sacramende",
      })
    })
  })

  it("returns a helpful error for unknown slugs", () => {
    expect.assertions(1)
    const query = gql`
      {
        city(slug: "sacramundo") {
          name
        }
      }
    `
    return runQuery(query).catch(e =>
      expect(e.message).toMatch(/City sacramundo not found in:/)
    )
  })

  it("finds the city nearest to a supplied point", () => {
    const pointNearSmallville = "{ lat: 40, lng: -100 }"
    const query = `
      {
        city(near: ${pointNearSmallville}) {
          name
        }
      }
    `

    return runQuery(query).then(result => {
      expect(result!.city).toEqual({
        name: "Smallville",
      })
    })
  })

  it("returns null if no cities are within a defined threshold", () => {
    const veryRemotePoint = "{ lat: 90, lng: 0 }"
    const query = gql`
      {
        city(near: ${veryRemotePoint}) {
          name
        }
      }
    `

    return runQuery(query).then(result => {
      expect(result!.city).toBeNull()
    })
  })

  describe("shows", () => {
    let query, rootValue, mockShows, mockShowsLoader

    beforeEach(() => {
      query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            name
            shows(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      `

      mockShows = [{ id: "first-show" }]
      mockShowsLoader = jest.fn(() =>
        Promise.resolve({ body: mockShows, headers: { "x-total-count": 1 } })
      )
      rootValue = {
        showsWithHeadersLoader: mockShowsLoader,
        accessToken: null,
        userID: null,
      }
    })

    it("resolves nearby shows", () => {
      return runQuery(query, rootValue).then(result => {
        expect(result!.city).toEqual({
          name: "Sacramende",
          shows: {
            edges: [
              {
                node: mockShows[0],
              },
            ],
          },
        })

        expect(mockShowsLoader).toHaveBeenCalledWith(
          expect.objectContaining({
            near: "38.5,-121.8",
          })
        )
      })
    })

    it("requests displayable shows, by default", async () => {
      await runQuery(query, rootValue)
      const gravityOptions = rootValue.showsWithHeadersLoader.mock.calls[0][0]

      expect(gravityOptions).toMatchObject({ displayable: true })
      expect(gravityOptions).not.toHaveProperty("discoverable")
    })

    it("can request all discoverable shows, optionally", async () => {
      query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            name
            shows(first: 1, discoverable: true) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      `
      await runQuery(query, rootValue)
      const gravityOptions = rootValue.showsWithHeadersLoader.mock.calls[0][0]

      expect(gravityOptions).toMatchObject({ discoverable: true })
      expect(gravityOptions).not.toHaveProperty("displayable")
    })
  })

  it("resolves nearby fairs", () => {
    const query = gql`
      {
        city(slug: "sacramende-ca-usa") {
          name
          fairs {
            id
          }
        }
      }
    `

    const mockFairs = [{ id: "first-fair" }]
    const mockFairsLoader = jest.fn(() => Promise.resolve(mockFairs))
    const rootValue = {
      fairsLoader: mockFairsLoader,
      accessToken: null,
      userID: null,
    }

    return runQuery(query, rootValue).then(result => {
      expect(result!.city).toEqual({
        name: "Sacramende",
        fairs: mockFairs,
      })

      expect(mockFairsLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          near: "38.5,-121.8",
        })
      )
    })
  })
})
