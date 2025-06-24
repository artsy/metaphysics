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

const marketingCollectionsSlugsData = [
  {
    slug: "percys-z-collection-1",
  },
  {
    slug: "fiby-z-collection-2",
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

    const context = {
      authenticatedLoaders: {},
      marketingCollectionsLoader: () =>
        Promise.resolve({ body: marketingCollectionsSlugsData }),
    } as any

    const data = await runQuery(query, context)

    expect(data).toEqual({
      curatedMarketingCollections: marketingCollectionsSlugsData,
    })
  })

  it("returns the marketing collections with a curated sort and specific category", async () => {
    const query = gql`
      {
        marketingCollections(sort: CURATED, size: 2, category: "Gallery") {
          slug
        }
      }
    `

    const context = {
      authenticatedLoaders: {},
    } as any

    context.marketingCollectionsLoader = jest
      .fn()
      .mockResolvedValue({ body: marketingCollectionsData })

    const data = await runQuery(query, context)

    expect(
      context.marketingCollectionsLoader.mock.calls[0][0]
    ).not.toContainKeys(["category", "sort"])

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
      marketingCollections: marketingCollectionsSlugsData,
    })
  })

  it("returns an error when used with curated sort and non-existing category params", async () => {
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

  it("returns an error when used with a curated sort and without category params", async () => {
    const query = gql`
      {
        marketingCollections(sort: CURATED, size: 2) {
          slug
        }
      }
    `
    const context = {} as any
    await expect(runQuery(query, context)).rejects.toThrow(
      "Category is required for CURATED sort."
    )
  })

  it("returns discovery marketing collections", async () => {
    const discoveryCollectionsData = [
      {
        slug: "most-loved",
        title: "Most Loved",
      },
      {
        slug: "understated",
        title: "Understated",
      },
    ]

    const query = gql`
      {
        discoveryMarketingCollections(size: 2) {
          slug
          title
        }
      }
    `

    const context = {
      marketingCollectionsLoader: ({ slugs }) =>
        Promise.resolve({
          body: discoveryCollectionsData.filter((collection) =>
            slugs.includes(collection.slug)
          ),
        }),
    } as any

    const data = await runQuery(query, context)

    expect(data).toEqual({
      discoveryMarketingCollections: discoveryCollectionsData,
    })
  })
})
