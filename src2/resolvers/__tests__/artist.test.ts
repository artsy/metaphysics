import { graphql } from "graphql"
import artnetDataManagers from "lib/apis/artnetDataManagers"
import { schema } from "../../schema"

jest.mock("lib/apis/artnetDataManagers", () => ({
  __esModule: true,
  default: jest.fn(),
}))
const mockArtnet = artnetDataManagers as jest.Mock

const run = (source: string, artistLoader: jest.Mock) =>
  graphql({ schema, source, contextValue: { artistLoader } })

const gravityArtist = {
  _id: "4d8b92b34eb68a1b2c0003f4",
  id: "andy-warhol",
  name: "Andy Warhol",
  display_name: "Warhol",
  alternate_names: ["Andrew Warhola"],
  disable_price_context: true,
  birthday: "1928",
  deathday: "1987",
}

describe("Query.artist", () => {
  it("maps Gravity fields onto the Artist type", async () => {
    const artistLoader = jest.fn().mockResolvedValue(gravityArtist)

    const { data, errors } = await run(
      `{
        artist(id: "andy-warhol") {
          id
          internalID
          slug
          alternateNames
          birthday
          deathday
          disablePriceContext
          displayLabel
          displayName
        }
      }`,
      artistLoader
    )

    expect(errors).toBeUndefined()
    expect(artistLoader).toHaveBeenCalledWith("andy-warhol")
    expect(data!.artist).toEqual({
      id: Buffer.from(`Artist:${gravityArtist._id}`).toString("base64"),
      internalID: "4d8b92b34eb68a1b2c0003f4",
      slug: "andy-warhol",
      alternateNames: ["Andrew Warhola"],
      birthday: "1928",
      deathday: "1987",
      disablePriceContext: true,
      displayLabel: "Andy Warhol",
      displayName: "Warhol",
    })
  })

  it("returns null without calling Gravity for an empty id", async () => {
    const artistLoader = jest.fn()

    const { data } = await run(`{ artist(id: "") { slug } }`, artistLoader)

    expect(data!.artist).toBeNull()
    expect(artistLoader).not.toHaveBeenCalled()
  })
})

describe("Artist.artistSeriesConnection", () => {
  const series = {
    _id: "s1",
    id: "series-one",
    title: "Series One",
    artist_ids: ["a1"],
    artworks_count: 1,
    description: "Hello *there*",
  }

  const runWithSeries = (source: string, artistSeriesListLoader: jest.Mock) =>
    graphql({
      schema,
      source,
      contextValue: {
        artistLoader: jest.fn().mockResolvedValue(gravityArtist),
        artistSeriesListLoader,
        artistsLoader: jest.fn().mockResolvedValue({ body: [gravityArtist] }),
      },
    })

  it("paginates and maps ArtistSeries nodes", async () => {
    const artistSeriesListLoader = jest.fn().mockResolvedValue({
      body: [series],
      headers: { "x-total-count": "3" },
    })

    const { data, errors } = await runWithSeries(
      `{
        artist(id: "andy-warhol") {
          artistSeriesConnection(first: 1) {
            totalCount
            pageInfo { hasNextPage }
            pageCursors { around { page isCurrent } }
            edges {
              node {
                internalID slug title artworksCountMessage
                descriptionFormatted(format: HTML)
                artists { slug }
              }
            }
          }
        }
      }`,
      artistSeriesListLoader
    )

    expect(errors).toBeUndefined()
    expect(artistSeriesListLoader).toHaveBeenCalledWith({
      artist_id: gravityArtist._id,
      page: 1,
      size: 1,
      total_count: true,
    })
    const connection = (data as any).artist.artistSeriesConnection
    expect(connection.totalCount).toBe(3)
    expect(connection.pageInfo.hasNextPage).toBe(true)
    expect(connection.pageCursors.around).toHaveLength(3)
    expect(connection.edges[0].node).toMatchObject({
      internalID: "s1",
      slug: "series-one",
      title: "Series One",
      artworksCountMessage: "1 work",
      artists: [{ slug: "andy-warhol" }],
    })
    expect(connection.edges[0].node.descriptionFormatted).toContain(
      "<em>there</em>"
    )
  })
})

describe("Query.artistSeriesConnection", () => {
  it("passes the root-only filter args to Gravity", async () => {
    const artistSeriesListLoader = jest.fn().mockResolvedValue({
      body: [{ _id: "s1", id: "series-one", title: "Series One" }],
      headers: { "x-total-count": "1" },
    })

    const { data, errors } = await graphql({
      schema,
      source: `{
        artistSeriesConnection(
          first: 5
          artistID: "a1"
          artworkID: "w1"
          excludeIDs: ["s9"]
        ) {
          totalCount
          edges { node { slug title } }
        }
      }`,
      contextValue: { artistSeriesListLoader },
    })

    expect(errors).toBeUndefined()
    expect(artistSeriesListLoader).toHaveBeenCalledWith({
      page: 1,
      size: 5,
      total_count: true,
      artist_id: "a1",
      artwork_id: "w1",
      exclude_ids: ["s9"],
    })
    expect(data).toEqual({
      artistSeriesConnection: {
        totalCount: 1,
        edges: [{ node: { slug: "series-one", title: "Series One" } }],
      },
    })
  })
})

describe("artistSeriesConnection without first/last", () => {
  it("falls back to a default page size so edges are returned", async () => {
    const artistSeriesListLoader = jest.fn().mockResolvedValue({
      body: [{ _id: "s1", id: "series-one" }],
      headers: { "x-total-count": "1" },
    })

    const { data, errors } = await graphql({
      schema,
      source: `{ artistSeriesConnection { totalCount edges { node { slug } } } }`,
      contextValue: { artistSeriesListLoader },
    })

    expect(errors).toBeUndefined()
    expect(artistSeriesListLoader).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, size: 10 })
    )
    expect(data).toEqual({
      artistSeriesConnection: {
        totalCount: 1,
        edges: [{ node: { slug: "series-one" } }],
      },
    })
  })
})

describe("Query.publicArtworkListings", () => {
  it("resolves top-level ArtListingSummary fields", async () => {
    mockArtnet.mockResolvedValue({
      body: {
        count: 1,
        warnings: [],
        results: [
          {
            id: "l1",
            artListingInternalId: "internal-1",
            saleCountries: ["US"],
            lot: {
              title: "Untitled",
              saleNumber: "42",
              externalUri: "http://x",
            },
          },
        ],
      },
    })

    const { data, errors } = await graphql({
      schema,
      source: `{
        publicArtworkListings(page: 1, pageSize: 5, freeformTextQuery: "warhol") {
          count
          results { id internalID title saleNumber externalUrl saleCountries }
        }
      }`,
    })

    expect(errors).toBeUndefined()
    expect(mockArtnet).toHaveBeenCalledWith(
      "coredata/v2/artwork-listings/search",
      {
        method: "POST",
        body: {
          freeformTextQuery: "warhol",
          filters: undefined,
          page: 1,
          pageSize: 5,
        },
      }
    )
    expect(data).toEqual({
      publicArtworkListings: {
        count: 1,
        results: [
          {
            id: "l1",
            internalID: "internal-1",
            title: "Untitled",
            saleNumber: "42",
            externalUrl: "http://x",
            saleCountries: ["US"],
          },
        ],
      },
    })
  })
})
