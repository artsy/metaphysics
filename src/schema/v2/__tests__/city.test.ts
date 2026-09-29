import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { MAX_GRAPHQL_INT, allViaLoader as _allViaLoader } from "lib/all"
import { TCity } from "../city"
import { HTTPError } from "lib/HTTPError"

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
}

const MOCK_EMPTY_CONTEXT = {
  geodataCitiesLoader: () => Promise.resolve([]),
}

jest.mock("lib/all.ts")
jest.mock("lib/sponsoredContent/data.json", () => {
  return {
    cities: {
      "sacramende-ca-usa": {
        introText: "Lorem ipsum dolot sit amet",
        artGuideUrl: "https://www.example.com/",
        featuredShowIds: ["456", "def"],
        showIds: ["abc", "123", "def", "456"],
      },
    },
  }
})

const allViaLoader = _allViaLoader as jest.Mock

describe("City", () => {
  afterEach(() => {
    allViaLoader.mockReset()
  })

  describe("finding by slug", () => {
    it("finds a city by its slug", async () => {
      const query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            name
          }
        }
      `

      const result = await runQuery(query, MOCK_CONTEXT)

      expect(result!.city).toEqual({
        name: "Sacramende",
      })
    })

    it("returns a helpful error for unknown slugs", async () => {
      expect.assertions(1)

      const query = gql`
        {
          city(slug: "sacramundo") {
            name
          }
        }
      `

      await expect(runQuery(query, MOCK_EMPTY_CONTEXT)).rejects.toThrow(
        'City "sacramundo" not found'
      )
    })
  })

  describe("finding by lat/lng", () => {
    it("finds the city nearest to a supplied point", async () => {
      const pointNearSmallville = "{ lat: 40, lng: -100 }"
      const query = `
        {
          city(near: ${pointNearSmallville}) {
            name
          }
        }
      `

      const result = await runQuery(query, MOCK_CONTEXT)

      expect(result!.city).toEqual({
        name: "Smallville",
      })
    })

    it("returns null if no cities are within a defined threshold", async () => {
      const veryRemotePoint = "{ lat: 90, lng: 0 }"
      const query = gql`
        {
          city(near: ${veryRemotePoint}) {
            name
          }
        }
      `

      const result = await runQuery(query, MOCK_CONTEXT)
      expect(result!.city).toBeNull()
    })
  })

  describe("shows", () => {
    let query, context, mockShows, mockShowsLoader

    beforeEach(() => {
      query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            name
            showsConnection(first: 1) {
              edges {
                node {
                  slug
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
        ...MOCK_CONTEXT,
        showsWithHeadersLoader: mockShowsLoader,
        accessToken: null,
        userID: null,
      }
    })

    it("resolves nearby shows", async () => {
      const result = await runQuery(query, context)
      expect(result!.city).toEqual({
        name: "Sacramende",
        showsConnection: {
          edges: [
            {
              node: {
                slug: "first-show",
              },
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

    it("can ask for including stubbed shows", async () => {
      query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            name
            showsConnection(first: 1, includeStubShows: true) {
              edges {
                node {
                  slug
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
            showsConnection(first: 1, status: CLOSING_SOON, dayThreshold: 5) {
              edges {
                node {
                  slug
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

    it("can cap shows per partner", async () => {
      query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            showsConnection(first: 1, maxPerPartner: 2) {
              edges {
                node {
                  slug
                }
              }
            }
          }
        }
      `
      await runQuery(query, context)
      const gravityOptions = context.showsWithHeadersLoader.mock.calls[0][0]

      expect(gravityOptions).toMatchObject({ max_per_partner: 2 })
    })

    it("works with null status and dayThreshold", async () => {
      query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            name
            showsConnection(first: 1, status: null, dayThreshold: null) {
              edges {
                node {
                  slug
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
              showsConnection(first: 1, partnerType: GALLERY) {
                edges {
                  node {
                    slug
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
              showsConnection(first: 1, partnerType: MUSEUM) {
                edges {
                  node {
                    slug
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
              showsConnection(first: 1, partnerType: null) {
                edges {
                  node {
                    slug
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

    describe("ranking for you", () => {
      const forYouQuery = gql`
        {
          city(slug: "sacramende-ca-usa") {
            showsConnection(
              first: 2
              after: "YXJyYXljb25uZWN0aW9uOjE="
              forYou: true
              status: RUNNING
              dayThreshold: 14
              maxPerPartner: 1
            ) {
              totalCount
              pageInfo {
                hasNextPage
              }
              edges {
                node {
                  slug
                }
              }
            }
          }
        }
      `

      const rankedShows = [{ id: "ranked-show" }, { id: "another-show" }]
      let meCityShowsLoader

      beforeEach(() => {
        meCityShowsLoader = jest.fn(() =>
          Promise.resolve({
            body: rankedShows,
            headers: { "x-total-count": "5" },
          })
        )
      })

      it("uses me/city_shows for a signed-in user, without a sort", async () => {
        const result = await runQuery(forYouQuery, {
          ...context,
          meCityShowsLoader,
        })

        expect(mockShowsLoader).not.toHaveBeenCalled()
        expect(meCityShowsLoader).toHaveBeenCalledWith({
          near: "38.5,-121.8",
          max_distance: 25,
          has_location: true,
          at_a_fair: false,
          day_threshold: 14,
          status: "running",
          displayable: true,
          include_local_discovery: false,
          include_discovery_blocked: false,
          max_per_partner: 1,
          page: 2,
          size: 2,
          total_count: true,
        })
        expect(result.city.showsConnection).toEqual({
          totalCount: 5,
          pageInfo: { hasNextPage: true },
          edges: [
            { node: { slug: "ranked-show" } },
            { node: { slug: "another-show" } },
          ],
        })
      })

      it("falls back to start_at order when signed out", async () => {
        await runQuery(forYouQuery, context)

        expect(mockShowsLoader).toHaveBeenCalledWith(
          expect.objectContaining({ sort: "start_at", status: "running" })
        )
      })

      it("falls back to start_at order when Gravity returns 404", async () => {
        meCityShowsLoader = jest.fn(() =>
          Promise.reject(new HTTPError("Not Found", 404))
        )

        const result = await runQuery(forYouQuery, {
          ...context,
          meCityShowsLoader,
        })

        const { sort, ...fallbackParams } = mockShowsLoader.mock.calls[0][0]
        expect(sort).toEqual("start_at")
        expect(fallbackParams).toEqual(meCityShowsLoader.mock.calls[0][0])
        expect(result.city.showsConnection.totalCount).toEqual(1)
      })

      it("surfaces other Gravity errors", async () => {
        meCityShowsLoader = jest.fn(() =>
          Promise.reject(new HTTPError("Internal Server Error", 500))
        )

        await expect(
          runQuery(forYouQuery, { ...context, meCityShowsLoader })
        ).rejects.toThrow("Internal Server Error")
        expect(mockShowsLoader).not.toHaveBeenCalled()
      })

      it("keeps the requested sort for other requests", async () => {
        query = gql`
          {
            city(slug: "sacramende-ca-usa") {
              showsConnection(first: 1, sort: PARTNER_ASC) {
                edges {
                  node {
                    slug
                  }
                }
              }
            }
          }
        `
        await runQuery(query, { ...context, meCityShowsLoader })

        expect(meCityShowsLoader).not.toHaveBeenCalled()
        expect(mockShowsLoader).toHaveBeenCalledWith(
          expect.objectContaining({ sort: "fully_qualified_name" })
        )
      })
    })

    it("can request all shows [that match other filter parameters]", async () => {
      allViaLoader.mockImplementation(() => Promise.resolve(mockShows))

      query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            showsConnection(first: ${MAX_GRAPHQL_INT}) {
              edges {
                node {
                  slug
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
        ...MOCK_CONTEXT,
        fairsLoader: mockFairsLoader,
      }
    })

    it("resolves nearby fairs", async () => {
      const query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            name
            fairsConnection(first: 1) {
              edges {
                node {
                  slug
                }
              }
            }
          }
        }
      `

      const result = await runQuery(query, context)
      expect(result!.city).toEqual({
        name: "Sacramende",
        fairsConnection: {
          edges: [{ node: { slug: "first-fair" } }],
        },
      })
      expect(mockFairsLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          near: "38.5,-121.8",
          total_count: true,
        })
      )
    })

    it("can request all shows [that match other filter parameters]", async () => {
      allViaLoader.mockImplementation(() => Promise.resolve(mockFairs))

      const query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            fairsConnection(first: ${MAX_GRAPHQL_INT}) {
              edges {
                node {
                  slug
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

      const result = await runQuery(query, MOCK_CONTEXT)

      expect(result.city.sponsoredContent).toEqual({
        introText: "Lorem ipsum dolot sit amet",
        artGuideUrl: "https://www.example.com/",
      })
    })

    it("includes shows and stub shows from a hard-coded list", async () => {
      const mockShows = [{ id: "sponsored-show" }]

      const mockShowsLoader = jest.fn().mockResolvedValue({
        headers: { "x-total-count": "1" },
        body: mockShows,
      })

      const context = {
        ...MOCK_CONTEXT,
        showsWithHeadersLoader: mockShowsLoader,
      }

      const query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            sponsoredContent {
              showsConnection(first: 1) {
                edges {
                  node {
                    slug
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
        showsConnection: {
          edges: [{ node: { slug: "sponsored-show" } }],
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
      const mockShowsLoader = jest.fn().mockResolvedValue(mockShows)
      const context = {
        ...MOCK_CONTEXT,
        showsLoader: mockShowsLoader,
      }

      const query = gql`
        {
          city(slug: "sacramende-ca-usa") {
            sponsoredContent {
              featuredShows {
                slug
              }
            }
          }
        }
      `

      const result = await runQuery(query, context)
      const gravityOptions = context.showsLoader.mock.calls[0][0]

      expect(result!.city.sponsoredContent).toEqual({
        featuredShows: [{ slug: "featured-show" }],
      })

      expect(gravityOptions).toMatchObject({
        id: ["456", "def"],
        include_local_discovery: true,
        displayable: true,
      })
    })
  })
})
