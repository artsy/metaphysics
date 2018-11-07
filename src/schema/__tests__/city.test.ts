import { runQuery } from "test/utils"
import gql from "lib/gql"

const mockCities = {
  "sacramende-ca-usa": {
    slug: "sacramende-ca-usa",
    name: "Sacramende",
    coordinates: { lat: 38.5, lng: -121.8 },
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

  it("resolves nearby shows", () => {
    const query = gql`
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

    const mockShows = [{ id: "first-show" }]
    const mockShowsLoader = jest.fn(() =>
      Promise.resolve({ body: mockShows, headers: { "x-total-count": 1 } })
    )
    const rootValue = {
      showsWithHeadersLoader: mockShowsLoader,
      accessToken: null,
      userID: null,
    }

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
