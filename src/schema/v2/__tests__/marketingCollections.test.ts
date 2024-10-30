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

  it("uses the curated sort for marketing collections", async () => {
    const query = gql`
      {
        marketingCollections(sort: CURATED, size: 2, category: "Gallery") {
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
    } as any

    context.marketingCollectionsLoader = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve({ body: payload }))

    const data = await runQuery(query, context)

    expect(context.marketingCollectionsLoader).toHaveBeenCalledWith({
      size: 2,
      slugs: [
        "new-from-tastemaking-galleries",
        "new-from-nonprofits-acaf27cc-2d39-4ed3-93dd-d7099e183691",
        "new-from-small-galleries",
        "new-from-leading-galleries",
        "new-to-artsy",
      ],
    })

    expect(data).toEqual({
      marketingCollections: payload,
    })
  })

  it("passes the params to the marketing collection loader", async () => {
    const query = gql`
      {
        marketingCollections(
          size: 2
          category: "trending"
          slugs: ["percys-z-collection-1", "fiby-z-collection-2"]
        ) {
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
    } as any

    context.marketingCollectionsLoader = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve({ body: payload }))

    const data = await runQuery(query, context)

    expect(context.marketingCollectionsLoader).toHaveBeenCalledWith({
      size: 2,
      category: "trending",
      slugs: ["percys-z-collection-1", "fiby-z-collection-2"],
    })

    expect(data).toEqual({
      marketingCollections: payload,
    })
  })

  it("throws an error when used with a non-existent category", async () => {
    const query = gql`
      {
        marketingCollections(sort: CURATED, size: 2, category: "newest") {
          slug
        }
      }
    `
    const context = {} as any
    await expect(runQuery(query, context)).rejects.toThrow(
      "No curated sort available for category: newest"
    )
  })
})
