import { runQuery } from "schema/v2/test/utils"
import { toGlobalId } from "graphql-relay"
import gql from "lib/gql"
import sinon from "sinon"

describe("artworksConnection", () => {
  let context

  describe(`Provides filter results`, () => {
    beforeEach(() => {
      context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: sinon
            .stub()
            .withArgs("filter/artworks", {
              gene_id: "500-1000-ce",
              aggregations: ["total"],
              for_sale: true,
            })
            .returns(
              Promise.resolve({
                hits: [
                  {
                    id: "oseberg-norway-queens-ship",
                    title: "Queen's Ship",
                    artists: [],
                  },
                ],
                aggregations: {
                  total: {
                    value: 10,
                  },
                },
              })
            ),
        },
      }
    })

    it("returns a connection, and makes one gravity call when args passed inline", async () => {
      const query = gql`
        {
          artworksConnection(
            geneID: "500-1000-ce"
            first: 10
            after: ""
            aggregations: [TOTAL]
            medium: "*"
            forSale: true
          ) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "oseberg-norway-queens-ship" } },
      ])
    })

    it("returns a connection, and makes one gravity call when using variables", async () => {
      const query = gql`
        query GeneFilter($count: Int, $cursor: String) {
          artworksConnection(
            geneID: "500-1000-ce"
            first: $count
            after: $cursor
            aggregations: [TOTAL]
            medium: "*"
            forSale: true
          ) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const variableValues = {
        count: 10,
        cursor: "",
      }

      const { artworksConnection } = await runQuery(
        query,
        context,
        variableValues
      )

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "oseberg-norway-queens-ship" } },
      ])
    })

    it("implements the NodeInterface", async () => {
      const query = gql`
        {
          artworksConnection(
            first: 10
            geneID: "500-1000-ce"
            forSale: true
            aggregations: [TOTAL]
            medium: "*"
          ) {
            id
          }
        }
      `
      const filterOptions = {
        aggregations: ["total"],
        for_sale: true,
        gene_id: "500-1000-ce",
        page: 1,
        size: 10,
      }
      const expectedId = toGlobalId(
        "filterArtworksConnection",
        JSON.stringify(filterOptions)
      )

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.id).toEqual(expectedId)
    })

    it("fetches FilterArtworks using the node root field", async () => {
      const filterOptions = {
        aggregations: ["total"],
        for_sale: true,
        gene_id: "500-1000-ce",
        page: 1,
        size: 10,
      }
      const generatedId = toGlobalId(
        "filterArtworksConnection",
        JSON.stringify(filterOptions)
      )

      const query = gql`
        {
          node(id: "${generatedId}") {
            id
            ...on FilterArtworksConnection {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      `

      const { node } = await runQuery(query, context)

      expect(node.id).toEqual(generatedId)
    })
  })

  describe(`Passes along an incoming page param over cursors`, () => {
    beforeEach(() => {
      context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: sinon
            .stub()
            .withArgs("filter/artworks", {
              gene_id: "500-1000-ce",
              aggregations: ["total"],
              for_sale: true,
              page: 20,
              size: 30,
            })
            .returns(
              Promise.resolve({
                hits: [
                  {
                    id: "oseberg-norway-queens-ship",
                    title: "Queen's Ship",
                    artists: [],
                  },
                ],
                aggregations: { total: { value: 1000 } },
              })
            ),
        },
      }
    })

    it("returns filtered artworks, and makes a gravity call", async () => {
      const query = gql`
        {
          artworksConnection(
            aggregations: [TOTAL]
            medium: "*"
            forSale: true
            page: 20
            first: 30
            after: ""
          ) {
            pageInfo {
              endCursor
            }
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "oseberg-norway-queens-ship" } },
      ])

      // Check that the cursor points to the end of page 20, size 30.
      // Base64 encoded string: `arrayconnection:599`
      expect(artworksConnection.pageInfo.endCursor).toEqual(
        "YXJyYXljb25uZWN0aW9uOjU5OQ=="
      )
    })
  })

  describe(`Pagination for the last page`, () => {
    beforeEach(() => {
      context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: sinon
            .stub()
            .withArgs("filter/artworks")
            .returns(
              Promise.resolve({
                hits: [
                  {
                    id: "oseberg-norway-queens-ship-0",
                    cursor: Buffer.from("artwork:297").toString("base64"),
                  },
                  {
                    id: "oseberg-norway-queens-ship-1",
                    cursor: Buffer.from("artwork:298").toString("base64"),
                  },
                  {
                    id: "oseberg-norway-queens-ship-2",
                    cursor: Buffer.from("artwork:299").toString("base64"),
                  },
                  {
                    id: "oseberg-norway-queens-ship-3",
                    cursor: Buffer.from("artwork:300").toString("base64"),
                  },
                ],
                aggregations: {
                  total: {
                    value: 303,
                  },
                },
              })
            ),
        },
      }
    })

    it("caps pagination results to 100", async () => {
      const query = gql`
        {
          artworksConnection(first: 3, after: "${Buffer.from(
            "artwork:297"
          ).toString("base64")}", aggregations:[TOTAL]) {
            pageInfo {
              hasNextPage
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.pageInfo.hasNextPage).toBeFalsy()
    })
  })

  describe(`Returns proper pagination information`, () => {
    beforeEach(() => {
      context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: sinon
            .stub()
            .withArgs("filter/artworks")
            .returns(
              Promise.resolve({
                hits: [
                  {
                    id: "oseberg-norway-queens-ship-0",
                  },
                  {
                    id: "oseberg-norway-queens-ship-1",
                  },
                  {
                    id: "oseberg-norway-queens-ship-2",
                  },
                  {
                    id: "oseberg-norway-queens-ship-3",
                  },
                ],
                aggregations: {
                  total: {
                    value: 5,
                  },
                },
              })
            ),
        },
      }
    })

    it("returns `true` for `hasNextPage` when there is more data", async () => {
      const query = gql`
        {
          artworksConnection(first: 4, after: "", aggregations: [TOTAL]) {
            pageInfo {
              hasNextPage
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.pageInfo.hasNextPage).toBeTruthy()
    })
  })

  describe(`Connection argument validation`, () => {
    beforeEach(() => {
      context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: jest.fn(),
        },
      }
    })

    it("throws an error when `first`, `last` and `size` are missing", async () => {
      expect.assertions(1)

      const query = gql`
        {
          artworksConnection(aggregations: [TOTAL]) {
            pageInfo {
              hasNextPage
            }
          }
        }
      `

      await expect(runQuery(query, context)).rejects.toThrow(
        "You must pass either `first`, `last` or `size`."
      )
    })
  })

  describe(`When requesting personalized arguments`, () => {
    beforeEach(() => {
      context = {
        authenticatedLoaders: {
          filterArtworksLoader: () =>
            Promise.resolve({
              hits: [
                {
                  id: "oseberg-norway-queens-ship-0",
                },
              ],
              aggregations: {
                total: {
                  value: 303,
                },
              },
            }),
        },
        unauthenticatedLoaders: {},
      }
    })

    it("returns results using the personalized loader", async () => {
      const query = gql`
        {
          artworksConnection(
            first: 1
            after: ""
            aggregations: [TOTAL]
            includeArtworksByFollowedArtists: true
          ) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "oseberg-norway-queens-ship-0" } },
      ])
    })

    it("returns results using the non personalized loader if there is no user", async () => {
      context = {
        unauthenticatedLoaders: {
          filterArtworksLoader: () =>
            Promise.resolve({
              hits: [
                {
                  id: "oseberg-norway-queens-ship-0",
                },
              ],
              aggregations: {
                total: {
                  value: 303,
                },
              },
            }),
        },
        authenticatedLoaders: {},
      }

      const query = gql`
        {
          artworksConnection(
            first: 1
            after: ""
            aggregations: [TOTAL, FOLLOWED_ARTISTS]
            includeArtworksByFollowedArtists: true
          ) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "oseberg-norway-queens-ship-0" } },
      ])
    })
  })

  describe(`When filtering on a sale and filtering/sorting by price`, () => {
    beforeEach(() => {
      context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: () =>
            Promise.resolve({
              hits: [
                {
                  id: "unauthenticated-loader-artwork-id",
                },
              ],
              aggregations: {
                total: {
                  value: 303,
                },
              },
            }),
        },
        filterArtworksUncachedLoader: () =>
          Promise.resolve({
            hits: [
              {
                id: "uncached-loader-artwork-id",
              },
            ],
            aggregations: {
              total: {
                value: 303,
              },
            },
          }),
      }
    })

    it("returns results using the uncached loader when sorting", async () => {
      const query = gql`
        {
          artworksConnection(first: 1, saleID: "sale-id", sort: "prices") {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "uncached-loader-artwork-id" } },
      ])
    })

    it("returns results using the uncached loader when filtering", async () => {
      const query = gql`
        {
          artworksConnection(
            first: 1
            saleID: "sale-id"
            priceRange: "*-1000"
          ) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "uncached-loader-artwork-id" } },
      ])
    })

    it("uses the unauthenticated loader when filtering with *-*", async () => {
      const query = gql`
        {
          artworksConnection(first: 1, priceRange: "*-*") {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "unauthenticated-loader-artwork-id" } },
      ])
    })

    it("uses the unauthenticated loader otherwise", async () => {
      const query = gql`
        {
          artworksConnection(first: 1, sort: "prices") {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "unauthenticated-loader-artwork-id" } },
      ])
    })
  })

  describe("Merchandisable artists aggregation", () => {
    beforeEach(() => {
      const mockArtworkResults = {
        hits: [
          { id: "kawaii-artwork-1" },
          { id: "kawaii-artwork-2" },
          { id: "kawaii-artwork-3" },
        ],
        aggregations: {
          total: { value: 42 },
          merchandisable_artists: {
            "id-1": { name: "Takashi Murakami", count: 42 },
            "id-2": { name: "Yamaguchi Ai", count: 42 },
            "id-3": { name: "Yoshitomo Nara", count: 42 },
            "id-4": { name: "Aya Takano", count: 42 },
            "id-5": { name: "Amano Yoshitaka", count: 42 },
          },
        },
      }

      const mockArtistResults = [
        { _id: "id-1", id: "takashi-murakami", name: "Takashi Murakami" },
        { _id: "id-2", id: "yamaguchi-ai", name: "Yamaguchi Ai" },
        { _id: "id-3", id: "yoshitomo-nara", name: "Yoshitomo Nara" },
        { _id: "id-4", id: "aya-takano", name: "Aya Takano" },
        { _id: "id-5", id: "amano-yoshitaka", name: "Amano Yoshitaka" },
      ]

      context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: jest.fn(() =>
            Promise.resolve(mockArtworkResults)
          ),
        },
        artistsLoader: jest.fn(
          // mock implementation to filter over the mock results above
          ({ ids }) =>
            Promise.resolve({
              body: mockArtistResults.filter(({ _id }) => ids.includes(_id)),
              headers: {},
            })
        ),
      }
    })

    it("returns all artists by default", async () => {
      const query = gql`
        {
          artworksConnection(
            geneID: "kawaii"
            first: 3
            aggregations: [MERCHANDISABLE_ARTISTS]
          ) {
            merchandisableArtists {
              slug
            }
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)
      const artistIdsToLoad = context.artistsLoader.mock.calls[0][0].ids

      expect(artistIdsToLoad).toEqual(["id-1", "id-2", "id-3", "id-4", "id-5"])

      expect(artworksConnection.merchandisableArtists).toHaveLength(5)
      expect(artworksConnection.merchandisableArtists).toEqual([
        { slug: "takashi-murakami" },
        { slug: "yamaguchi-ai" },
        { slug: "yoshitomo-nara" },
        { slug: "aya-takano" },
        { slug: "amano-yoshitaka" },
      ])
    })

    it("can limit the number of returned artists", async () => {
      const query = gql`
        {
          artworksConnection(
            geneID: "kawaii"
            first: 3
            aggregations: [MERCHANDISABLE_ARTISTS]
          ) {
            merchandisableArtists(size: 2) {
              slug
            }
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)
      const artistIdsToLoad = context.artistsLoader.mock.calls[0][0].ids

      expect(artistIdsToLoad).toEqual(["id-1", "id-2"])

      expect(artworksConnection.merchandisableArtists).toHaveLength(2)
      expect(artworksConnection.merchandisableArtists).toEqual([
        { slug: "takashi-murakami" },
        { slug: "yamaguchi-ai" },
      ])
    })
  })

  describe("Accepting an `input` argument", () => {
    beforeEach(() => {
      context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: sinon
            .stub()
            .withArgs("filter/artworks", {
              gene_id: "500-1000-ce",
              aggregations: ["total"],
              for_sale: true,
            })
            .returns(
              Promise.resolve({
                hits: [
                  {
                    id: "oseberg-norway-queens-ship",
                    title: "Queen's Ship",
                    artists: [],
                  },
                ],
                aggregations: {
                  total: {
                    value: 10,
                  },
                },
              })
            ),
        },
      }
    })

    it("returns a connection", async () => {
      const query = gql`
        {
          artworksConnection(
            input: {
              geneID: "500-1000-ce"
              first: 10
              after: ""
              aggregations: [TOTAL]
              medium: "*"
              forSale: true
            }
          ) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "oseberg-norway-queens-ship" } },
      ])
    })

    it("prefers `input` arguments over ones specified in the root", async () => {
      const query = gql`
        {
          artworksConnection(
            aggregations: []
            medium: null
            input: {
              geneID: "500-1000-ce"
              first: 10
              after: ""
              aggregations: [TOTAL]
              medium: "*"
              forSale: true
            }
          ) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "oseberg-norway-queens-ship" } },
      ])
    })
  })

  describe("filter by marketing_collection_id", () => {
    beforeEach(() => {
      const filterArtworksLoader = jest.fn((args) => {
        if (args.marketing_collection_id === "kaws-toys") {
          return Promise.resolve({
            hits: [
              {
                id: "kaws-toys",
              },
            ],
            aggregations: {
              total: {
                value: 1,
              },
            },
          })
        }

        return Promise.reject("unexpected marketing_collection_id")
      })

      context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: filterArtworksLoader,
        },
      }
    })

    it("returns correct artwork", async () => {
      const query = gql`
        {
          artworksConnection(
            input: { marketingCollectionID: "kaws-toys", first: 1, after: "" }
          ) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "kaws-toys" } },
      ])
    })
  })

  describe("filter by framed", () => {
    const mockFilterArtworksLoader = jest.fn(() => {
      return Promise.resolve({
        hits: [
          {
            id: "kaws-toys",
          },
        ],
        aggregations: {
          total: {
            value: 1,
          },
        },
      })
    })

    it("returns correct artwork", async () => {
      const context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: mockFilterArtworksLoader,
        },
      }

      const query = gql`
        {
          artworksConnection(input: { framed: true, first: 10 }) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(mockFilterArtworksLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          framed: true,
        })
      )

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "kaws-toys" } },
      ])
    })
  })

  describe("filter by published", () => {
    const mockFilterArtworksLoader = jest.fn(() => {
      return Promise.resolve({
        hits: [
          {
            id: "kaws-toys",
          },
        ],
        aggregations: {
          total: {
            value: 1,
          },
        },
      })
    })

    it("returns correct artwork for published=false", async () => {
      const context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: mockFilterArtworksLoader,
        },
      }

      const query = gql`
        {
          artworksConnection(input: { published: false, first: 10 }) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(mockFilterArtworksLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregations: ["total"],
          include_unpublished: true,
          offset: 0,
          page: 1,
          published: false,
          size: 10,
        })
      )

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "kaws-toys" } },
      ])
    })

    it("returns correct artwork for published=true", async () => {
      const context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: mockFilterArtworksLoader,
        },
      }

      const query = gql`
        {
          artworksConnection(input: { published: true, first: 10 }) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(mockFilterArtworksLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregations: ["total"],
          offset: 0,
          page: 1,
          published: true,
          size: 10,
        })
      )

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "kaws-toys" } },
      ])
    })
  })

  describe("filter by signed", () => {
    const mockFilterArtworksLoader = jest.fn(() => {
      return Promise.resolve({
        hits: [
          {
            id: "kaws-toys",
          },
        ],
        aggregations: {
          total: {
            value: 1,
          },
        },
      })
    })

    it("returns correct artwork", async () => {
      const context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: mockFilterArtworksLoader,
        },
      }

      const query = gql`
        {
          artworksConnection(input: { signed: true, first: 10 }) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(mockFilterArtworksLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          signed: true,
        })
      )

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "kaws-toys" } },
      ])
    })
  })
})
