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

const mockSponsoredContent = {
  cities: {
    "sacramende-ca-usa": {
      introText: "Lorem ipsum dolot sit amet",
      artGuideUrl: "https://www.example.com/",
    },
  },
}

jest.mock("../city/city_data.json", () => mockCities)
jest.mock("lib/all.ts")
jest.mock("lib/sponsoredContent/data.json", () => mockSponsoredContent)

import { runQuery } from "test/utils"
import gql from "lib/gql"
import { MAX_GRAPHQL_INT, allViaLoader as _allViaLoader } from "lib/all"

const allViaLoader = _allViaLoader as jest.Mock<typeof _allViaLoader>

describe("City", () => {
  afterEach(() => {
    allViaLoader.mockReset()
  })

  describe("finding by slug", () => {
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
  })

  describe("finding by lat/lng", () => {
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
  })

  describe("shows", () => {
    let query, context, mockShows, mockShowsLoader

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
        Promise.resolve({ body: mockShows, headers: { "x-total-count": "1" } })
      )
      context = {
        showsWithHeadersLoader: mockShowsLoader,
        accessToken: null,
        userID: null,
      }
    })

    it("resolves nearby shows", () => {
      return runQuery(query, context).then(result => {
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
            total_count: true,
          })
        )
      })
    })

    it("requests displayable shows, by default", async () => {
      await runQuery(query, context)
      const gravityOptions = context.showsWithHeadersLoader.mock.calls[0][0]

      expect(gravityOptions).toMatchObject({ displayable: true })
      expect(gravityOptions).not.toHaveProperty("discoverable")
    })

    it("can filter by discoverable shows", async () => {
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
      await runQuery(query, context)
      const gravityOptions = context.showsWithHeadersLoader.mock.calls[0][0]

      expect(gravityOptions).toMatchObject({ discoverable: true })
      expect(gravityOptions).not.toHaveProperty("displayable")
    })

    it("can request all shows [that match other filter parameters]", async () => {
      allViaLoader.mockImplementation(() => Promise.resolve(mockShows))

      query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            shows(first: ${MAX_GRAPHQL_INT}) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      `
      await runQuery(query, context)

      expect(allViaLoader).toHaveBeenCalledWith(
        mockShowsLoader,
        expect.anything()
      )
    })
  })

  describe("fairs", () => {
    let mockFairs
    let mockFairsLoader
    let context

    beforeEach(() => {
      mockFairs = [{ id: "first-fair" }]
      mockFairsLoader = jest.fn(() =>
        Promise.resolve({ body: mockFairs, headers: { "x-total-count": "1" } })
      )
      context = {
        fairsLoader: mockFairsLoader,
      }
    })

    it("resolves nearby fairs", () => {
      const query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            name
            fairs(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      `

      return runQuery(query, context).then(result => {
        expect(result!.city).toEqual({
          name: "Sacramende",
          fairs: {
            edges: [{ node: { id: "first-fair" } }],
          },
        })

        expect(mockFairsLoader).toHaveBeenCalledWith(
          expect.objectContaining({
            near: "38.5,-121.8",
            total_count: true,
          })
        )
      })
    })

    it("can request all shows [that match other filter parameters]", async () => {
      allViaLoader.mockImplementation(() => Promise.resolve(mockFairs))

      const query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            fairs(first: ${MAX_GRAPHQL_INT}) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      `
      await runQuery(query, context)

      expect(allViaLoader).toHaveBeenCalledWith(
        mockFairsLoader,
        expect.anything()
      )
    })
  })

  it("includes sponsored content", async () => {
    const query = gql`
      {
        city(slug: "sacramende-ca-usa") {
          sponsoredContent {
            introText
            artGuideUrl
          }
        }
      }
    `

    const result = await runQuery(query)

    expect(result!.city.sponsoredContent).toEqual({
      introText: "Lorem ipsum dolot sit amet",
      artGuideUrl: "https://www.example.com/",
    })
  })
})
