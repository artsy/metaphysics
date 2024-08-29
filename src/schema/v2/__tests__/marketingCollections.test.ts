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
      Object {
        "marketingCollections": Array [
          Object {
            "artworksConnection": Object {
              "edges": Array [
                Object {
                  "node": Object {
                    "slug": "percy-1",
                  },
                },
                Object {
                  "node": Object {
                    "slug": "fiby-2",
                  },
                },
              ],
            },
          },
          Object {
            "artworksConnection": Object {
              "edges": Array [
                Object {
                  "node": Object {
                    "slug": "percy-1",
                  },
                },
                Object {
                  "node": Object {
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
})
