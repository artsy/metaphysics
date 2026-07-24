import config from "config"
import gql from "lib/gql"
import { extractNodes } from "lib/helpers"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const buildQuery = (args: any = {}) => {
  const first = args.first || 10
  const includeBackfill = args.includeBackfill || false
  const userId = args.userId || "abc123"
  const excludeDislikedArtworks = args.excludeDislikedArtworks || false

  const query = gql`
      {
        artworksForUser(first: ${first}, includeBackfill: ${includeBackfill}, userId: "${userId}", excludeDislikedArtworks: ${excludeDislikedArtworks}) {
          totalCount
          pageInfo {
            hasPreviousPage
            hasNextPage
          }
          edges {
            node {
              title
            }
          }
        }
      }
    `

  return query
}

const buildContext = (responses: any = {}) => {
  const {
    newForYouRecommendations,
    newForYouArtworks,
    sets,
    setItems,
  } = responses
  const mockArtworksLoader = jest.fn(() => Promise.resolve(newForYouArtworks))
  const mockSetsLoader = jest.fn(() => Promise.resolve({ body: sets }))
  const mockSetItemsLoader = jest.fn(() => Promise.resolve({ body: setItems }))
  const mockVortexGraphqlLoader = jest.fn(() => () =>
    Promise.resolve({ data: { newForYouRecommendations } })
  )

  const context = {
    artworksLoader: mockArtworksLoader,
    setsLoader: mockSetsLoader,
    setItemsLoader: mockSetItemsLoader,
    userID: "vortex-user-id",
    authenticatedLoaders: {
      vortexGraphqlLoader: mockVortexGraphqlLoader,
    },
    unauthenticatedLoaders: {
      vortexGraphqlLoader: null,
    },
  } as any

  return context
}

describe("artworksForUser", () => {
  describe("with no artwork recommendations", () => {
    it("returns an empty array", async () => {
      const query = buildQuery()
      const affinities = []
      const context = buildContext({ affinities })

      const response = await runAuthenticatedQuery(query, context)
      expect(response.artworksForUser).not.toBeNull()

      const artworks = extractNodes(response.artworksForUser)
      expect(artworks.length).toEqual(0)

      expect(response.artworksForUser.totalCount).toBe(0)
      expect(response.artworksForUser.pageInfo).toMatchInlineSnapshot(`
        {
          "hasNextPage": false,
          "hasPreviousPage": false,
        }
      `)
    })
  })

  describe("with no affinity artworks", () => {
    it("returns an empty array", async () => {
      const query = buildQuery()
      const newForYouRecommendations = [{}]
      const newForYouArtworks = []
      const context = buildContext({
        newForYouRecommendations,
        newForYouArtworks,
      })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(0)

      expect(artworksForUser.totalCount).toBe(0)
      expect(artworksForUser.pageInfo).toMatchInlineSnapshot(`
        {
          "hasNextPage": false,
          "hasPreviousPage": false,
        }
      `)
    })
  })

  describe("with recs and new for you artworks", () => {
    it("returns those artworks", async () => {
      const query = buildQuery()
      const newForYouRecommendations = {
        edges: [{ node: { artworkId: "valid-id" } }],
      }
      const newForYouArtworks = [{}]
      const context = buildContext({
        newForYouRecommendations,
        newForYouArtworks,
      })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(1)

      expect(artworksForUser.totalCount).toBe(1)
      expect(artworksForUser.pageInfo).toMatchInlineSnapshot(`
        {
          "hasNextPage": false,
          "hasPreviousPage": false,
        }
      `)
    })
  })

  describe("with backfill and no flag", () => {
    it("returns artworks without backfill", async () => {
      const query = buildQuery({ includeBackfill: false })
      const newForYouRecommendations = {
        edges: [{ node: { artworkId: "valid-id" } }],
      }
      const newForYouArtworks = [{}]
      const context = buildContext({
        newForYouRecommendations,
        newForYouArtworks,
      })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(1)

      expect(artworksForUser.totalCount).toBe(1)
      expect(artworksForUser.pageInfo).toMatchInlineSnapshot(`
        {
          "hasNextPage": false,
          "hasPreviousPage": false,
        }
      `)
    })
  })

  describe("with backfill and the flag but enough affinity artworks", () => {
    it("returns affinity artworks without backfill", async () => {
      const query = buildQuery({ first: 1, includeBackfill: true })
      const newForYouRecommendations = {
        edges: [{ node: { artworkId: "valid-id" } }],
      }
      const newForYouArtworks = [{}]
      const sets = [{ id: "valid-id" }]
      const setItems = [{}]
      const context = buildContext({
        newForYouRecommendations,
        newForYouArtworks,
        sets,
        setItems,
      })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(1)

      expect(artworksForUser.totalCount).toBe(2)
      expect(artworksForUser.pageInfo).toMatchInlineSnapshot(`
        {
          "hasNextPage": true,
          "hasPreviousPage": false,
        }
      `)
    })
  })

  describe("with backfill and the flag and not enough affinity artworks", () => {
    it("returns affinity artworks with backfill", async () => {
      const query = buildQuery({ first: 2, includeBackfill: true })
      const newForYouRecommendations = {
        edges: [{ node: { artworkId: "valid-id" } }],
      }
      const newForYouArtworks = [{ id: "valid-id" }]
      const sets = [{ id: "valid-id" }]
      const setItems = [{ id: "other-valid-id" }]
      const context = buildContext({
        newForYouRecommendations,
        newForYouArtworks,
        sets,
        setItems,
      })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(2)

      expect(artworksForUser.totalCount).toBe(2)
      expect(artworksForUser.pageInfo).toMatchInlineSnapshot(`
        {
          "hasNextPage": false,
          "hasPreviousPage": false,
        }
      `)
    })
  })

  describe("with no backfill and the flag and not enough affinity artworks", () => {
    it("returns only the affinity artworks", async () => {
      const query = buildQuery({ first: 2, includeBackfill: true })
      const newForYouRecommendations = {
        edges: [{ node: { artworkId: "valid-id" } }],
      }
      const newForYouArtworks = [{}]
      const context = buildContext({
        newForYouRecommendations,
        newForYouArtworks,
      })

      const { artworksForUser } = await runAuthenticatedQuery(query, context)
      const artworks = extractNodes(artworksForUser)
      expect(artworks.length).toEqual(1)

      expect(artworksForUser.totalCount).toBe(1)
      expect(artworksForUser.pageInfo).toMatchInlineSnapshot(`
        {
          "hasNextPage": false,
          "hasPreviousPage": false,
        }
      `)
    })
  })

  describe("with the Gravity NWFY rail enabled", () => {
    beforeEach(() => {
      ;(config as any).ENABLE_NEW_WORKS_FOR_YOU_GRAVITY = true
    })

    afterEach(() => {
      ;(config as any).ENABLE_NEW_WORKS_FOR_YOU_GRAVITY = false
    })

    it("sources ids from the Gravity rail and composes the connection (skipping Vortex)", async () => {
      const query = buildQuery({ first: 2, includeBackfill: true })
      const artworkRecommendationsLoader = jest.fn(async () => ({
        artwork_ids: ["g1", "g2"],
      }))
      const newForYouArtworks = [{ id: "g1" }, { id: "g2" }]
      const context = buildContext({ newForYouArtworks })
      context.artworkRecommendationsLoader = artworkRecommendationsLoader

      const { artworksForUser } = await runAuthenticatedQuery(query, context)

      expect(artworkRecommendationsLoader).toHaveBeenCalledWith(
        expect.objectContaining({ rail: "nwfy", user_id: "abc123" })
      )
      expect(
        context.authenticatedLoaders.vortexGraphqlLoader
      ).not.toHaveBeenCalled()
      // Downstream (artwork fetch → connection) is the shared path, unchanged.
      expect(context.artworksLoader).toHaveBeenCalledWith(
        expect.objectContaining({ ids: ["g1", "g2"], availability: "for sale" })
      )
      expect(extractNodes(artworksForUser).length).toEqual(2)
      expect(artworksForUser.totalCount).toBe(2)
    })
  })

  describe("excludeDislikedArtworks option", () => {
    it("passes exclude_disliked_artworks parameter to Gravity loaders", async () => {
      const query = buildQuery({
        first: 2,
        includeBackfill: true,
        excludeDislikedArtworks: true,
      })
      const newForYouRecommendations = {
        edges: [{ node: { artworkId: "valid-id" } }],
      }
      const newForYouArtworks = [{}]
      const sets = [{ id: "valid-id" }]
      const setItems = [{}]
      const context = buildContext({
        newForYouRecommendations,
        newForYouArtworks,
        sets,
        setItems,
      })

      const response = await runAuthenticatedQuery(query, context)

      expect(context.artworksLoader).toBeCalledWith(
        expect.objectContaining({
          exclude_disliked_artworks: true,
        })
      )

      expect(context.setItemsLoader).toBeCalledWith("valid-id", {
        exclude_disliked_artworks: true,
      })

      expect(response.artworksForUser.totalCount).toBe(2)
    })
  })

  // Loaders that model Gravity: the /artworks batch loader silently drops ids
  // that don't hydrate, and honors the ids it's actually given.
  const buildFaithfulContext = ({
    recIds,
    deadIds = [],
    titles = {},
    backfillItems = [],
  }: {
    recIds: string[]
    deadIds?: string[]
    titles?: Record<string, string>
    backfillItems?: Array<{ id: string; title: string }>
  }) => {
    const artworksLoader = jest.fn(async ({ ids }: { ids: string[] }) =>
      ids
        .filter((id) => !deadIds.includes(id))
        .map((id) => ({ id, _id: id, title: titles[id] || id }))
    )

    return {
      artworkRecommendationsLoader: jest.fn(async () => ({
        artwork_ids: recIds,
      })),
      artworksLoader,
      setsLoader: jest.fn(async () => ({ body: [{ id: "backfill-set" }] })),
      setItemsLoader: jest.fn(async () => ({
        body: backfillItems.map((item) => ({ ...item, _id: item.id })),
      })),
      userID: "vortex-user-id",
      authenticatedLoaders: { vortexGraphqlLoader: null },
      unauthenticatedLoaders: { vortexGraphqlLoader: null },
    } as any
  }

  const buildPaginatedQuery = ({
    first,
    after,
  }: {
    first: number
    after?: string
  }) => gql`
    {
      artworksForUser(
        first: ${first}
        ${after ? `after: "${after}"` : ""}
        includeBackfill: true
        userId: "abc123"
        excludeDislikedArtworks: true
      ) {
        totalCount
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
          node {
            internalID
            title
          }
        }
      }
    }
  `

  describe("when a rec id in the page window does not hydrate", () => {
    beforeEach(() => ((config as any).ENABLE_NEW_WORKS_FOR_YOU_GRAVITY = true))
    afterEach(() => ((config as any).ENABLE_NEW_WORKS_FOR_YOU_GRAVITY = false))

    it("does not splice backfill in before real recs a larger page would show", async () => {
      // r2 is stale and won't hydrate; a first: 5 window [r0..r4] loses it,
      // yet r5 is a real rec that should fill the slot before any backfill.
      const context = buildFaithfulContext({
        recIds: ["r0", "r1", "r2", "r3", "r4", "r5"],
        deadIds: ["r2"],
        titles: {
          r0: "Rec 0",
          r1: "Rec 1",
          r3: "Rec 3",
          r4: "Rec 4",
          r5: "Rec 5",
        },
        backfillItems: [{ id: "b0", title: "BACKFILL" }],
      })

      const { artworksForUser } = await runAuthenticatedQuery(
        buildPaginatedQuery({ first: 5 }),
        context
      )

      const titles = extractNodes(artworksForUser).map((n: any) => n.title)

      expect(titles).not.toContain("BACKFILL")
      expect(titles).toEqual(["Rec 0", "Rec 1", "Rec 3", "Rec 4", "Rec 5"])
    })
  })

  describe("when paginating across multiple pages with backfill", () => {
    beforeEach(() => ((config as any).ENABLE_NEW_WORKS_FOR_YOU_GRAVITY = true))
    afterEach(() => ((config as any).ENABLE_NEW_WORKS_FOR_YOU_GRAVITY = false))

    it("never returns the same backfill artwork on more than one page", async () => {
      // 1 real rec, 4 backfill items, paging by 2: page 2 must continue the
      // backfill window instead of restarting it from the top.
      const backfillItems = [
        { id: "b0", title: "Backfill 0" },
        { id: "b1", title: "Backfill 1" },
        { id: "b2", title: "Backfill 2" },
        { id: "b3", title: "Backfill 3" },
      ]
      const context = buildFaithfulContext({
        recIds: ["r0"],
        titles: { r0: "Rec 0" },
        backfillItems,
      })

      const page1 = await runAuthenticatedQuery(
        buildPaginatedQuery({ first: 2 }),
        context
      )
      const page1Ids = extractNodes(page1.artworksForUser).map(
        (n: any) => n.internalID
      )

      const page2 = await runAuthenticatedQuery(
        buildPaginatedQuery({
          first: 2,
          after: page1.artworksForUser.pageInfo.endCursor,
        }),
        context
      )
      const page2Ids = extractNodes(page2.artworksForUser).map(
        (n: any) => n.internalID
      )

      // Real rec first, then the backfill window advances by page size.
      expect(page1Ids).toEqual(["r0", "b0"])
      expect(page2Ids).toEqual(["b1", "b2"])
    })
  })

  describe("totalCount when some rec ids do not hydrate", () => {
    beforeEach(() => ((config as any).ENABLE_NEW_WORKS_FOR_YOU_GRAVITY = true))
    afterEach(() => ((config as any).ENABLE_NEW_WORKS_FOR_YOU_GRAVITY = false))

    it("counts surviving recs, not the raw recommendation ids", async () => {
      // 3 recommended ids, 1 stale; 2 backfill items. totalCount must reflect
      // the 2 recs that hydrate (+ backfill), not the 3 ids Gravity returned.
      const context = buildFaithfulContext({
        recIds: ["r0", "r1", "r2"],
        deadIds: ["r1"],
        titles: { r0: "Rec 0", r2: "Rec 2" },
        backfillItems: [
          { id: "b0", title: "Backfill 0" },
          { id: "b1", title: "Backfill 1" },
        ],
      })

      const { artworksForUser } = await runAuthenticatedQuery(
        buildPaginatedQuery({ first: 10 }),
        context
      )

      expect(artworksForUser.totalCount).toBe(4)
    })
  })
})
