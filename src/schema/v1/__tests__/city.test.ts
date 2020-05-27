const mockCities = [
  {
    slug: "sacramende-ca-usa",
    name: "Sacramende",
    coordinates: { lat: 38.5, lng: -121.8 },
  },
  {
    slug: "smallvile-usa",
    name: "Smallville",
    coordinates: { lat: 39.78, lng: -100.45 },
  },
]

const mockSponsoredContent = {
  cities: {
    "sacramende-ca-usa": {
      introText: "Lorem ipsum dolot sit amet",
      artGuideUrl: "https://www.example.com/",
      featuredShowIds: ["456", "def"],
      showIds: ["abc", "123", "def", "456"],
    },
  },
}

jest.mock("../city/cityDataSortedByDisplayPreference.json", () => mockCities)
jest.mock("lib/all.ts")
jest.mock("lib/sponsoredContent/data.json", () => mockSponsoredContent)

import { runQuery } from "schema/v1/test/utils"
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

      return runQuery(query).then((result) => {
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
      return runQuery(query).catch((e) =>
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

      return runQuery(query).then((result) => {
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

      return runQuery(query).then((result) => {
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
      return runQuery(query, context).then((result) => {
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

    it("requests non-blocked discovery shows, by default", async () => {
      await runQuery(query, context)
      const gravityOptions = context.showsWithHeadersLoader.mock.calls[0][0]

      expect(gravityOptions).toMatchObject({ include_discovery_blocked: false })
    })

    it("requests shows with location, by default", async () => {
      await runQuery(query, context)
      const gravityOptions = context.showsWithHeadersLoader.mock.calls[0][0]

      expect(gravityOptions).toMatchObject({ has_location: true })
    })
    it("excludes fair booths, by default", async () => {
      await runQuery(query, context)
      const gravityOptions = context.showsWithHeadersLoader.mock.calls[0][0]

      expect(gravityOptions).toMatchObject({ at_a_fair: false })
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

      expect(gravityOptions).toMatchObject({
        include_local_discovery: true,
        displayable: true,
      })
    })

    it("can ask for including stubbed shows", async () => {
      query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            name
            shows(first: 1, includeStubShows: true) {
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

      expect(gravityOptions).toMatchObject({
        include_local_discovery: true,
        displayable: true,
      })
    })

    it("can filter to shows by status and dayThreshold", async () => {
      query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            name
            shows(first: 1, status: CLOSING_SOON, dayThreshold: 5) {
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

      expect(gravityOptions).toMatchObject({
        day_threshold: 5,
        status: "closing_soon",
      })
    })

    it("works with null status and dayThreshold", async () => {
      query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            name
            shows(first: 1, status: null, dayThreshold: null) {
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

      expect(context.showsWithHeadersLoader).not.toHaveBeenCalledWith(
        expect.objectContaining({
          day_threshold: expect.anything(),
          status: expect.anything(),
        })
      )
    })

    describe("filtering by partner type", () => {
      it("can filter to gallery shows", async () => {
        query = gql`
          {
            city(slug: "sacramende-ca-usa") {
              name
              shows(first: 1, partnerType: GALLERY) {
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

        expect(gravityOptions).toMatchObject({ partner_types: ["Gallery"] })
      })

      it("can filter to museum shows", async () => {
        query = gql`
          {
            city(slug: "sacramende-ca-usa") {
              name
              shows(first: 1, partnerType: MUSEUM) {
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

        expect(gravityOptions).toMatchObject({
          partner_types: ["Institution", "Institutional Seller"],
        })
      })

      it("works with a null partner type", async () => {
        query = gql`
          {
            city(slug: "sacramende-ca-usa") {
              name
              shows(first: 1, partnerType: null) {
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

        expect(gravityOptions.partner_types).toBeUndefined()
      })
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

      return runQuery(query, context).then((result) => {
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

  describe("sponsored content", () => {
    it("includes static texts", async () => {
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

    it("includes shows and stub shows from a hard-coded list", async () => {
      const mockShows = [{ id: "sponsored-show" }]

      const mockShowsLoader = jest.fn(() =>
        Promise.resolve({
          headers: { "x-total-count": "1" },
          body: mockShows,
        })
      )

      const context = {
        showsWithHeadersLoader: mockShowsLoader,
      }

      const query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            sponsoredContent {
              shows(first: 1) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
      `

      const result = await runQuery(query, context)
      const gravityOptions = context.showsWithHeadersLoader.mock.calls[0][0]

      expect(result!.city.sponsoredContent).toEqual({
        shows: {
          edges: [{ node: { id: "sponsored-show" } }],
        },
      })

      expect(gravityOptions).toMatchObject({
        id: ["abc", "123", "def", "456"],
        include_local_discovery: true,
        displayable: true,
      })
    })

    it("includes featured shows", async () => {
      const mockShows = [{ id: "featured-show" }]
      const mockShowsLoader = jest.fn(() => Promise.resolve(mockShows))
      const context = {
        showsLoader: mockShowsLoader,
      }

      const query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            sponsoredContent {
              featuredShows {
                id
              }
            }
          }
        }
      `

      const result = await runQuery(query, context)
      const gravityOptions = context.showsLoader.mock.calls[0][0]

      expect(result!.city.sponsoredContent).toEqual({
        featuredShows: [{ id: "featured-show" }],
      })

      expect(gravityOptions).toMatchObject({
        id: ["456", "def"],
        include_local_discovery: true,
        displayable: true,
      })
    })
  })
})
