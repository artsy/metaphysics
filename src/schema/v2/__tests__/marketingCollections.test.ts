import gql from "lib/gql"
import { runQuery } from "../test/utils"

const marketingCollectionsData = [
  {
    id: "percys-z-collection-1",
    slug: "percys-z-collection-1",
    title: "Percy Z Collection",
  },
  {
    id: "fiby-z-collection-2",
    slug: "fiby-z-collection-2",
    title: "Fiby Z Collection 2",
  },
]

describe("MarketingCollections", () => {
  it("returns a list of marketing collections", async () => {
    const query = gql`
      {
        marketingCollections {
          slug
          title
        }
      }
    `
    const context = {
      marketingCollectionsLoader: () =>
        Promise.resolve({ body: marketingCollectionsData }),
    } as any

    const data = await runQuery(query, context)

    expect(data).toEqual({
      marketingCollections: marketingCollectionsData.map(({ slug, title }) => ({
        slug,
        title,
      })),
    })
  })
  it("returns marketing collection", async () => {
    const query = gql`
      {
        marketingCollection(slug: "percys-z-collection-1") {
          internalID
          slug
          title
        }
      }
    `

    const payload = marketingCollectionsData[0]

    const context = {
      marketingCollectionLoader: () => Promise.resolve(payload),
    } as any

    const data = await runQuery(query, context)
    const { id, ...expected } = payload

    expect(data).toEqual({
      marketingCollection: { ...expected, internalID: payload.id },
    })
  })
  it("return marketing collection artworks by partnerID", async () => {
    const query = gql`
      {
        marketingCollections {
          artworksConnection(first: 2, partnerID: "partner-id") {
            edges {
              node {
                slug
              }
            }
          }
        }
      }
    `

    const context: any = {
      authenticatedLoaders: {},
      unauthenticatedLoaders: {
        filterArtworksLoader: () =>
          Promise.resolve({
            hits: [
              {
                id: "percy-1",
                title: "Percy's Ship",
                artists: [],
              },
              {
                id: "fiby-2",
                title: "Fibi's Ship",
                artists: [],
              },
            ],
            aggregations: { total: { value: 999 } },
          }),
      },
      marketingCollectionsLoader: () =>
        Promise.resolve({ body: marketingCollectionsData }),
    }

    const data = await runQuery(query, context)

    expect(data).toMatchInlineSnapshot(`
      {
        "marketingCollections": [
          {
            "artworksConnection": {
              "edges": [
                {
                  "node": {
                    "slug": "percy-1",
                  },
                },
                {
                  "node": {
                    "slug": "fiby-2",
                  },
                },
              ],
            },
          },
          {
            "artworksConnection": {
              "edges": [
                {
                  "node": {
                    "slug": "percy-1",
                  },
                },
                {
                  "node": {
                    "slug": "fiby-2",
                  },
                },
              ],
            },
          },
        ],
      }
    `)
  })
  it("requests an ordered set of collections by slug when using curated sort", async () => {
    const marketingCollectionsLoaderMock = jest
      .fn()
      .mockResolvedValue({ body: marketingCollectionsData })

    const query = gql`
      {
        marketingCollections(category: "Collect by Price", sort: CURATED) {
          slug
          title
        }
      }
    `

    const context: any = {
      marketingCollectionsLoader: marketingCollectionsLoaderMock,
    }

    await runQuery(query, context)

    expect(marketingCollectionsLoaderMock.mock.calls[0][0]).not.toContainKeys([
      "category",
      "sort",
    ])
    expect(marketingCollectionsLoaderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        slugs: [
          "art-under-500-dollars",
          "art-under-1000-dollars",
          "art-under-2500-dollars",
          "art-under-5000-dollars",
          "art-under-10000-dollars",
          "art-under-25000-dollars",
          "art-under-50000-dollars",
        ],
      })
    )
  })

  it("returns curated marketing collections", async () => {
    const query = gql`
      {
        curatedMarketingCollections(size: 2) {
          slug
        }
      }
    `

    const payload = [
      {
        slug: "percys-z-collection-1",
      },
      {
        slug: "fiby-z-collection-2",
      },
    ]

    const context = {
      authenticatedLoaders: {},
      marketingCollectionsLoader: () => Promise.resolve({ body: payload }),
    } as any

    const data = await runQuery(query, context)

    expect(data).toEqual({
      curatedMarketingCollections: payload,
    })
  })
})
