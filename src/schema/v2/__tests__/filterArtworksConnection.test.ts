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

  describe("filter by variant", () => {
    const mockFilterArtworksLoader = jest.fn((_args) => {
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

    const context = {
      authenticatedLoaders: {},
      unauthenticatedLoaders: {
        filterArtworksLoader: mockFilterArtworksLoader,
      },
    }

    it("passes variant to Gravity when provided", async () => {
      const query = gql`
        {
          artworksConnection(input: { variant: "hybrid", first: 10 }) {
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
          variant: "hybrid",
        })
      )

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "kaws-toys" } },
      ])
    })

    it("does not pass variant to Gravity when omitted", async () => {
      const query = gql`
        {
          artworksConnection(input: { first: 10 }) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      await runQuery(query, context)

      expect(mockFilterArtworksLoader).toHaveBeenCalledWith(
        expect.not.objectContaining({
          variant: expect.anything(),
        })
      )
    })
  })

  describe("hybrid search tuning args", () => {
    const mockFilterArtworksLoader = jest.fn((_args) => {
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

    const context = {
      authenticatedLoaders: {},
      unauthenticatedLoaders: {
        filterArtworksLoader: mockFilterArtworksLoader,
      },
    }

    it("passes the hybrid args to Gravity when variant is hybrid", async () => {
      const query = gql`
        {
          artworksConnection(
            input: {
              variant: "hybrid"
              hybridNeuralK: 50
              hybridWeights: [0.3, 0.7]
              hybridPaginationDepth: 500
              first: 10
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

      expect(mockFilterArtworksLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "hybrid",
          hybrid_neural_k: 50,
          hybrid_weights: [0.3, 0.7],
          hybrid_pagination_depth: 500,
        })
      )

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "kaws-toys" } },
      ])
    })

    it("does not pass any hybrid args to Gravity when omitted", async () => {
      const query = gql`
        {
          artworksConnection(input: { variant: "hybrid", first: 10 }) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      await runQuery(query, context)

      expect(mockFilterArtworksLoader).toHaveBeenCalledWith(
        expect.not.objectContaining({
          hybrid_neural_k: expect.anything(),
        })
      )
      expect(mockFilterArtworksLoader).toHaveBeenCalledWith(
        expect.not.objectContaining({
          hybrid_weights: expect.anything(),
        })
      )
      expect(mockFilterArtworksLoader).toHaveBeenCalledWith(
        expect.not.objectContaining({
          hybrid_pagination_depth: expect.anything(),
        })
      )
    })

    it("throws when a hybrid arg is provided without variant: hybrid", async () => {
      const query = gql`
        {
          artworksConnection(input: { hybridNeuralK: 50, first: 10 }) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      await expect(runQuery(query, context)).rejects.toThrow(
        '`hybridNeuralK`, `hybridWeights`, and `hybridPaginationDepth` can only be used when `variant` is "hybrid".'
      )
    })

    it("throws when a hybrid arg is provided with a non-hybrid variant", async () => {
      const query = gql`
        {
          artworksConnection(
            input: { variant: "keyword", hybridWeights: [0.5, 0.5], first: 10 }
          ) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      await expect(runQuery(query, context)).rejects.toThrow(
        '`hybridNeuralK`, `hybridWeights`, and `hybridPaginationDepth` can only be used when `variant` is "hybrid".'
      )
    })

    it("throws when hybridNeuralK is out of range", async () => {
      const tooLow = gql`
        {
          artworksConnection(
            input: { variant: "hybrid", hybridNeuralK: 0, first: 10 }
          ) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      await expect(runQuery(tooLow, context)).rejects.toThrow(
        "`hybridNeuralK` must be between 1 and 200."
      )

      const tooHigh = gql`
        {
          artworksConnection(
            input: { variant: "hybrid", hybridNeuralK: 201, first: 10 }
          ) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      await expect(runQuery(tooHigh, context)).rejects.toThrow(
        "`hybridNeuralK` must be between 1 and 200."
      )
    })

    it("throws when hybridPaginationDepth is out of range", async () => {
      const tooLow = gql`
        {
          artworksConnection(
            input: { variant: "hybrid", hybridPaginationDepth: 0, first: 10 }
          ) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      await expect(runQuery(tooLow, context)).rejects.toThrow(
        "`hybridPaginationDepth` must be between 1 and 10000."
      )

      const tooHigh = gql`
        {
          artworksConnection(
            input: {
              variant: "hybrid"
              hybridPaginationDepth: 10001
              first: 10
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

      await expect(runQuery(tooHigh, context)).rejects.toThrow(
        "`hybridPaginationDepth` must be between 1 and 10000."
      )
    })

    it("throws when hybridWeights does not contain exactly two floats", async () => {
      const query = gql`
        {
          artworksConnection(
            input: { variant: "hybrid", hybridWeights: [0.5], first: 10 }
          ) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      await expect(runQuery(query, context)).rejects.toThrow(
        "`hybridWeights` must contain exactly two floats."
      )
    })
  })

  describe("CMS request filtering", () => {
    describe("simple CMS requests", () => {
      it("uses partnerArtworksAllLoader for simple CMS requests", async () => {
        const partnerArtworks = [
          { id: "artwork1", title: "Artwork 1" },
          { id: "artwork2", title: "Artwork 2" },
        ]

        const mockPartnerArtworksAllLoader = jest.fn(() =>
          Promise.resolve({
            body: partnerArtworks,
            headers: {
              "x-total-count": "2",
            },
          })
        )

        const mockFilterArtworksLoader = jest.fn()

        const context = {
          authenticatedLoaders: {},
          unauthenticatedLoaders: {
            filterArtworksLoader: mockFilterArtworksLoader,
          },
          isCMSRequest: true,
          partnerArtworksAllLoader: mockPartnerArtworksAllLoader,
        }

        const query = gql`
          {
            artworksConnection(
              input: {
                partnerID: "partner123"
                sort: "-created_at"
                includeUnpublished: true
                disableNotForSaleSorting: true
                medium: "*"
                first: 10
              }
            ) {
              edges {
                node {
                  slug
                  title
                }
              }
              counts {
                total
              }
            }
          }
        `

        const { artworksConnection } = await runQuery(query, context)

        expect(mockPartnerArtworksAllLoader).toHaveBeenCalledWith(
          "partner123",
          expect.objectContaining({
            size: 10,
            page: 1,
            sort: "-created_at,-id",
            total_count: true,
          })
        )

        expect(mockFilterArtworksLoader).not.toHaveBeenCalled()

        expect(artworksConnection.edges).toEqual([
          { node: { slug: "artwork1", title: "Artwork 1" } },
          { node: { slug: "artwork2", title: "Artwork 2" } },
        ])
        expect(artworksConnection.counts.total).toEqual(2)
      })
    })

    describe("complex CMS requests", () => {
      it("falls back to search for CMS requests with additional filters", async () => {
        const mockFilterArtworksLoader = jest.fn(() =>
          Promise.resolve({
            hits: [
              {
                id: "artwork1",
                title: "Artwork 1",
              },
            ],
            aggregations: {
              total: {
                value: 1,
              },
            },
          })
        )

        const mockPartnerArtworksAllLoader = jest.fn()

        const context = {
          authenticatedLoaders: {},
          unauthenticatedLoaders: {
            filterArtworksLoader: mockFilterArtworksLoader,
          },
          isCMSRequest: true,
          partnerArtworksAllLoader: mockPartnerArtworksAllLoader,
        }

        const query = gql`
          {
            artworksConnection(
              input: {
                partnerID: "partner123"
                sort: "-created_at"
                includeUnpublished: true
                disableNotForSaleSorting: true
                medium: "*"
                priceRange: "1000-5000"
                first: 10
              }
            ) {
              edges {
                node {
                  slug
                  title
                }
              }
              counts {
                total
              }
            }
          }
        `

        const { artworksConnection } = await runQuery(query, context)

        expect(mockFilterArtworksLoader).toHaveBeenCalled()

        expect(mockPartnerArtworksAllLoader).not.toHaveBeenCalled()

        expect(artworksConnection.edges).toEqual([
          { node: { slug: "artwork1", title: "Artwork 1" } },
        ])
        expect(artworksConnection.counts.total).toEqual(1)
      })
    })
  })

  describe("simple partner list CMS requests", () => {
    it("uses partnerListArtworksLoader for simple partner list CMS requests", async () => {
      const partnerListArtworks = [
        { artwork: { id: "artwork1", title: "Artwork 1" } },
        { artwork: { id: "artwork2", title: "Artwork 2" } },
      ]

      const mockPartnerListArtworksLoader = jest.fn(() =>
        Promise.resolve({
          body: partnerListArtworks,
          headers: {
            "x-total-count": "2",
          },
        })
      )

      const mockFilterArtworksLoader = jest.fn()

      const context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: mockFilterArtworksLoader,
        },
        isCMSRequest: true,
        partnerListArtworksLoader: mockPartnerListArtworksLoader,
      }

      const query = gql`
        {
          artworksConnection(
            input: {
              partnerListID: "list123"
              sort: "partner_list_position"
              includeUnpublished: true
              disableNotForSaleSorting: true
              first: 10
            }
          ) {
            edges {
              node {
                slug
                title
              }
            }
            counts {
              total
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(mockPartnerListArtworksLoader).toHaveBeenCalledWith(
        "list123",
        expect.objectContaining({
          size: 10,
          page: 1,
          total_count: true,
        })
      )

      expect(mockFilterArtworksLoader).not.toHaveBeenCalled()

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "artwork1", title: "Artwork 1" } },
        { node: { slug: "artwork2", title: "Artwork 2" } },
      ])
      expect(artworksConnection.counts.total).toEqual(2)
    })

    it("falls back to search for partner list requests with additional filters", async () => {
      const mockFilterArtworksLoader = jest.fn(() =>
        Promise.resolve({
          hits: [
            {
              id: "artwork1",
              title: "Artwork 1",
            },
          ],
          aggregations: {
            total: {
              value: 1,
            },
          },
        })
      )

      const mockPartnerListArtworksLoader = jest.fn()

      const context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: mockFilterArtworksLoader,
        },
        isCMSRequest: true,
        partnerListArtworksLoader: mockPartnerListArtworksLoader,
      }

      const query = gql`
        {
          artworksConnection(
            input: {
              partnerListID: "list123"
              sort: "partner_list_position"
              includeUnpublished: true
              disableNotForSaleSorting: true
              priceRange: "1000-5000"
              first: 10
            }
          ) {
            edges {
              node {
                slug
                title
              }
            }
            counts {
              total
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(mockFilterArtworksLoader).toHaveBeenCalled()
      expect(mockPartnerListArtworksLoader).not.toHaveBeenCalled()

      expect(artworksConnection.edges).toEqual([
        { node: { slug: "artwork1", title: "Artwork 1" } },
      ])
      expect(artworksConnection.counts.total).toEqual(1)
    })
  })

  describe("includeNonArtsyListed filter", () => {
    it("passes include_non_artsy_listed to the loader when provided", async () => {
      const mockFilterArtworksLoader = jest.fn(() =>
        Promise.resolve({
          hits: [
            {
              id: "artwork1",
              title: "Artwork 1",
            },
          ],
          aggregations: {
            total: {
              value: 1,
            },
          },
        })
      )

      const context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: mockFilterArtworksLoader,
        },
      }

      const query = gql`
        {
          artworksConnection(
            input: {
              includeNonArtsyListed: true
              aggregations: [TOTAL]
              first: 10
            }
          ) {
            edges {
              node {
                slug
                title
              }
            }
          }
        }
      `

      await runQuery(query, context)

      expect(mockFilterArtworksLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          include_non_artsy_listed: true,
        })
      )
    })

    it("does not pass include_non_artsy_listed when not provided", async () => {
      const mockFilterArtworksLoader = jest.fn(() =>
        Promise.resolve({
          hits: [
            {
              id: "artwork1",
              title: "Artwork 1",
            },
          ],
          aggregations: {
            total: {
              value: 1,
            },
          },
        })
      )

      const context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: mockFilterArtworksLoader,
        },
      }

      const query = gql`
        {
          artworksConnection(input: { aggregations: [TOTAL], first: 10 }) {
            edges {
              node {
                slug
                title
              }
            }
          }
        }
      `

      await runQuery(query, context)

      expect(mockFilterArtworksLoader).toHaveBeenCalledWith(
        expect.not.objectContaining({
          include_non_artsy_listed: expect.anything(),
        })
      )
    })
  })

  describe(`completenessTier filter`, () => {
    let context

    beforeEach(() => {
      context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: sinon
            .stub()
            .withArgs("filter/artworks", {
              completeness_tier: ["Good", "Excellent"],
              aggregations: ["total"],
            })
            .returns(
              Promise.resolve({
                hits: [
                  {
                    id: "artwork-1",
                    title: "Good Artwork",
                  },
                  {
                    id: "artwork-2",
                    title: "Excellent Artwork",
                  },
                ],
                aggregations: {
                  total: {
                    value: 2,
                  },
                },
              })
            ),
        },
      }
    })

    it("accepts multiple completeness tiers", async () => {
      const query = gql`
        {
          artworksConnection(
            completenessTier: ["Good", "Excellent"]
            aggregations: [TOTAL]
            first: 10
          ) {
            edges {
              node {
                title
              }
            }
            counts {
              total
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { node: { title: "Good Artwork" } },
        { node: { title: "Excellent Artwork" } },
      ])
      expect(artworksConnection.counts.total).toEqual(2)
    })

    it("accepts a single completeness tier in array format", async () => {
      context.unauthenticatedLoaders.filterArtworksLoader = sinon
        .stub()
        .withArgs("filter/artworks", {
          completeness_tier: ["Incomplete"],
          aggregations: ["total"],
        })
        .returns(
          Promise.resolve({
            hits: [
              {
                id: "artwork-3",
                title: "Incomplete Artwork",
              },
            ],
            aggregations: {
              total: {
                value: 1,
              },
            },
          })
        )

      const query = gql`
        {
          artworksConnection(
            completenessTier: ["Incomplete"]
            aggregations: [TOTAL]
            first: 10
          ) {
            edges {
              node {
                title
              }
            }
            counts {
              total
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { node: { title: "Incomplete Artwork" } },
      ])
      expect(artworksConnection.counts.total).toEqual(1)
    })

    it("accepts all three completeness tiers", async () => {
      context.unauthenticatedLoaders.filterArtworksLoader = sinon
        .stub()
        .withArgs("filter/artworks", {
          completeness_tier: ["Incomplete", "Good", "Excellent"],
          aggregations: ["total"],
        })
        .returns(
          Promise.resolve({
            hits: [
              {
                id: "artwork-4",
                title: "Incomplete Artwork",
              },
              {
                id: "artwork-5",
                title: "Good Artwork",
              },
              {
                id: "artwork-6",
                title: "Excellent Artwork",
              },
            ],
            aggregations: {
              total: {
                value: 3,
              },
            },
          })
        )

      const query = gql`
        {
          artworksConnection(
            completenessTier: ["Incomplete", "Good", "Excellent"]
            aggregations: [TOTAL]
            first: 10
          ) {
            edges {
              node {
                title
              }
            }
            counts {
              total
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { node: { title: "Incomplete Artwork" } },
        { node: { title: "Good Artwork" } },
        { node: { title: "Excellent Artwork" } },
      ])
      expect(artworksConnection.counts.total).toEqual(3)
    })
  })

  describe("curator notes on marketing-collection-scoped connections", () => {
    it("stamps notes onto edges by looking the collection up by id/slug", async () => {
      const context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: () =>
            Promise.resolve({
              hits: [
                { _id: "percy-1-id", id: "percy-1", title: "Percy's Ship", artists: [] },
                { _id: "fiby-2-id", id: "fiby-2", title: "Fiby's Ship", artists: [] },
              ],
              aggregations: { total: { value: 2 } },
            }),
        },
        marketingCollectionLoader: () =>
          Promise.resolve({
            slug: "curators-picks",
            artwork_notes: [
              { artwork_id: "percy-1-id", note: "Chosen for its bold use of color" },
            ],
          }),
      }

      const query = gql`
        {
          artworksConnection(
            marketingCollectionID: "curators-picks"
            first: 2
            aggregations: [TOTAL]
          ) {
            edges {
              note
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { note: "Chosen for its bold use of color", node: { slug: "percy-1" } },
        { note: null, node: { slug: "fiby-2" } },
      ])
    })

    it("does not fail the connection when the collection lookup errors", async () => {
      const context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: () =>
            Promise.resolve({
              hits: [{ _id: "percy-1-id", id: "percy-1", title: "Percy's Ship", artists: [] }],
              aggregations: { total: { value: 1 } },
            }),
        },
        marketingCollectionLoader: () => Promise.reject(new Error("boom")),
      }

      const query = gql`
        {
          artworksConnection(
            marketingCollectionID: "curators-picks"
            first: 1
            aggregations: [TOTAL]
          ) {
            edges {
              note
              node {
                slug
              }
            }
          }
        }
      `

      const { artworksConnection } = await runQuery(query, context)

      expect(artworksConnection.edges).toEqual([
        { note: null, node: { slug: "percy-1" } },
      ])
    })
  })
})
