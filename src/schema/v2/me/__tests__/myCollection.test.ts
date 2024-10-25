import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("me.myCollection", () => {
  const marketPriceInsightsBatchLoader = jest.fn(async () => mockVortexResponse)

  it("returns artworks for a collection and passes params correctly", async () => {
    const query = gql`
      {
        me {
          myCollectionConnection(first: 10, artistIDs: ["artist-id"]) {
            edges {
              node {
                internalID
                title
                artist {
                  internalID
                }
              }
            }
            pageInfo {
              hasNextPage
              startCursor
              endCursor
            }
            pageCursors {
              around {
                cursor
                page
                isCurrent
              }
              first {
                cursor
                page
                isCurrent
              }
              last {
                cursor
                page
                isCurrent
              }
              previous {
                cursor
                page
              }
            }
          }
        }
      }
    `

    const meMyCollectionArtworksLoader = jest.fn(
      async () => mockCollectionArtworksResponse
    )

    const context: Partial<ResolverContext> = {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),

      meMyCollectionArtworksLoader,
      marketPriceInsightsBatchLoader,
      artistLoader: () =>
        Promise.resolve({
          _id: "artist-id",
        }),
    }

    const data = await runAuthenticatedQuery(query, context)
    expect(data.me.myCollectionConnection.edges[0].node.title).toBe(
      "some title"
    )

    expect(meMyCollectionArtworksLoader).toHaveBeenCalledWith({
      artist_ids: ["artist-id"],
      exclude_purchased_artworks: false,
      include_only_target_supply: false,
      offset: 0,
      size: 10,
      total_count: true,
      sort_by_last_auction_result_date: false,
    })
  })

  describe("when passing the argument sortByLastAuctionResultDate", () => {
    it("sort by most recent price insight updates and filter out artworks without insights.", async () => {
      const query = gql`
        {
          me {
            myCollectionConnection(
              first: 10
              sortByLastAuctionResultDate: true
            ) {
              edges {
                node {
                  marketPriceInsights {
                    lastAuctionResultDate
                  }
                }
              }
            }
          }
        }
      `

      const context: Partial<ResolverContext> = {
        meLoader: () =>
          Promise.resolve({
            id: "some-user-id",
          }),

        meMyCollectionArtworksLoader: async () =>
          mockCollectionArtworksResponse,
        marketPriceInsightsBatchLoader: jest.fn(async () => mockVortexResponse),
        artistLoader: () =>
          Promise.resolve({
            _id: "artist-id",
          }),
      }

      const data = await runAuthenticatedQuery(query, context)

      expect(data.me.myCollectionConnection.edges).toMatchInlineSnapshot(`
        [
          {
            "node": {
              "marketPriceInsights": {
                "lastAuctionResultDate": "2023-06-15T00:00:00Z",
              },
            },
          },
          {
            "node": {
              "marketPriceInsights": {
                "lastAuctionResultDate": "2022-06-15T00:00:00Z",
              },
            },
          },
        ]
      `)
    })
  })

  it("queries for only target supply artworks when includeOnlyTargetSupply argument is present", async () => {
    const query = gql`
      {
        me {
          myCollectionConnection(first: 10, includeOnlyTargetSupply: true) {
            edges {
              node {
                title
              }
            }
          }
        }
      }
    `

    const mockMeMyCollectionArtworksLoader = jest.fn(() => {
      return mockCollectionArtworksResponse
    })

    const context: Partial<ResolverContext> = {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),

      meMyCollectionArtworksLoader: mockMeMyCollectionArtworksLoader,
      marketPriceInsightsBatchLoader: jest.fn(async () => mockVortexResponse),
      artistLoader: () =>
        Promise.resolve({
          _id: "artist-id",
        }),
    }

    await runAuthenticatedQuery(query, context)

    expect(mockMeMyCollectionArtworksLoader).toHaveBeenCalledWith({
      exclude_purchased_artworks: false,
      offset: 0,
      include_only_target_supply: true,
      size: 10,
      sort_by_last_auction_result_date: false,
      total_count: true,
    })
  })

  it("enriches artwork with consignment submissions data", async () => {
    const query = gql`
      {
        me {
          myCollectionConnection(first: 10) {
            edges {
              node {
                internalID
                title
                artist {
                  internalID
                }
                consignmentSubmission {
                  displayText
                }
              }
            }
          }
        }
      }
    `

    const context: Partial<ResolverContext> = {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),
      meMyCollectionArtworksLoader: () =>
        Promise.resolve({
          body: [
            {
              _id: "artwork_id_with_submission",
              id: "artwork_id_with_submission",
              title: "some title",
              artist: {
                _id: "artist-id",
              },
              submission_id: "1",
            },
            {
              _id: "artwork_id_without_submission",
              id: "artwork_id_without_submission",
              title: "some title 2",
              artist: null,
              submission_id: null,
            },
            {
              _id: "artwork_id_with_draft_submission",
              id: "artwork_id_with_draft_submission",
              title: "some title 3",
              artist: {
                _id: "artist-id",
              },
              submission_id: null,
            },
          ],
          headers: {
            "x-total-count": "10",
          },
        }),
      convectionGraphQLLoader: () =>
        Promise.resolve({
          submissions: {
            edges: [
              {
                node: {
                  id: "1",
                  my_collection_artwork_id: "artwork_id_with_submission",
                  state: "submitted",
                },
              },
            ],
          } as any,
        }),
      marketPriceInsightsBatchLoader,
      artistLoader: () =>
        Promise.resolve({
          _id: "artist-id",
        }),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data.me.myCollectionConnection.edges[0].node.title).toBe(
      "some title"
    )
    expect(
      data.me.myCollectionConnection.edges[0].node.consignmentSubmission
        .displayText
    ).toBe("Submission in progress")

    expect(data.me.myCollectionConnection.edges[1].node.title).toBe(
      "some title 2"
    )
    expect(
      data.me.myCollectionConnection.edges[1].node.consignmentSubmission
    ).toBeFalsy()

    expect(data.me.myCollectionConnection.edges[2].node.title).toBe(
      "some title 3"
    )
    expect(
      data.me.myCollectionConnection.edges[2].node.consignmentSubmission
    ).toBeFalsy()
  })

  it("returns artworks without submission information if submissions not found", async () => {
    const query = gql`
      {
        me {
          myCollectionConnection(first: 10) {
            edges {
              node {
                internalID
                title
                artist {
                  internalID
                }
                consignmentSubmission {
                  displayText
                }
              }
            }
          }
        }
      }
    `

    const context: Partial<ResolverContext> = {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),
      meMyCollectionArtworksLoader: () =>
        Promise.resolve({
          body: [
            {
              _id: "artwork_id_with_submission",
              id: "artwork_id_with_submission",
              title: "some title",
              artist: {
                _id: "artist-id",
              },
              submission_id: "1",
            },
            {
              _id: "artwork_id_without_submission",
              id: "artwork_id_without_submission",
              title: "some title 2",
              artist: {
                _id: "artist-id",
              },
              submission_id: null,
            },
            {
              _id: "artwork_id_with_draft_submission",
              id: "artwork_id_with_draft_submission",
              title: "some title 3",
              artist: {
                _id: "artist-id",
              },
              submission_id: null,
            },
          ],
          headers: {
            "x-total-count": "10",
          },
        }),
      marketPriceInsightsBatchLoader,
      convectionGraphQLLoader: () =>
        Promise.resolve({
          submissions: {
            edges: [],
          } as any,
        }),
      artistLoader: () =>
        Promise.resolve({
          _id: "artist-id",
        }),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(
      data.me.myCollectionConnection.edges[0].node.consignmentSubmission
    ).toBeFalsy()

    expect(
      data.me.myCollectionConnection.edges[1].node.consignmentSubmission
    ).toBeFalsy()

    expect(
      data.me.myCollectionConnection.edges[2].node.consignmentSubmission
    ).toBeFalsy()
  })

  it("enriches artwork with market price insights data", async () => {
    const query = gql`
      {
        me {
          myCollectionConnection(first: 10) {
            edges {
              node {
                internalID
                title
                category
                artist {
                  internalID
                }
                marketPriceInsights {
                  annualValueSoldDisplayText
                  averageSalePriceDisplayText
                  demandRank
                  demandRankDisplayText
                  liquidityRankDisplayText
                  medianSalePriceDisplayText
                }
              }
            }
          }
        }
      }
    `

    const context: Partial<ResolverContext> = {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),
      meMyCollectionArtworksLoader: () =>
        Promise.resolve({
          body: [
            {
              _id: "artwork_id_with_market_price_insights",
              id: "artwork_id_with_market_price_insights",
              title: "some title",
              category: "Painting",
              artist: {
                _id: "artist-id",
              },
            },
          ],
          headers: {
            "x-total-count": "10",
          },
        }),
      marketPriceInsightsBatchLoader,
      artistLoader: () =>
        Promise.resolve({
          _id: "artist-id",
        }),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toMatchInlineSnapshot(`
      {
        "me": {
          "myCollectionConnection": {
            "edges": [
              {
                "node": {
                  "artist": {
                    "internalID": "artist-id",
                  },
                  "category": "Painting",
                  "internalID": "artwork_id_with_market_price_insights",
                  "marketPriceInsights": {
                    "annualValueSoldDisplayText": "$22M",
                    "averageSalePriceDisplayText": "US$2,176,421",
                    "demandRank": 0.64,
                    "demandRankDisplayText": "Moderate Demand",
                    "liquidityRankDisplayText": "Medium",
                    "medianSalePriceDisplayText": "US$5,776,622,000",
                  },
                  "title": "some title",
                },
              },
            ],
          },
        },
      }
    `)
  })

  it("ignores collection not found errors and returns an empty array", async () => {
    const query = gql`
      {
        me {
          myCollectionConnection(first: 10) {
            edges {
              node {
                internalID
                title
              }
            }
          }
        }
      }
    `
    console.error = jest.fn() // Suppress error output
    const context: Partial<ResolverContext> = {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),
      meMyCollectionArtworksLoader: () =>
        Promise.reject(new Error("Collection Not Found")),
      marketPriceInsightsBatchLoader,
    }

    const data = await runAuthenticatedQuery(query, context)
    expect(data.me.myCollectionConnection.edges).toEqual([])
  })

  it("fails with all other errors", async () => {
    const query = gql`
      {
        me {
          myCollectionConnection(first: 10) {
            edges {
              node {
                internalID
                title
              }
            }
          }
        }
      }
    `
    console.error = jest.fn() // Suppress error output
    const context: Partial<ResolverContext> = {
      meLoader: () =>
        Promise.resolve({
          id: "some-user-id",
        }),
      meMyCollectionArtworksLoader: () =>
        Promise.reject(new Error("Some other error")),
      marketPriceInsightsBatchLoader,
    }

    expect.assertions(1)

    await expect(runAuthenticatedQuery(query, context)).rejects.toThrow(
      "Some other error"
    )
  })
})

const mockCollectionArtworksResponse = {
  body: [
    {
      _id: "58e3e54aa09a6708282022f6",
      title: "some title",
      medium: "Painting and something else",
      category: "Print",
      artist: {
        _id: "artist-id",
      },
    },
    {
      _id: "58e3e52aa09a6708282022f6",
      title: "another title",
      medium: "Painting and something else",
      category: "Print",
      artist: {
        _id: "artist-id",
      },
    },
    {
      _id: "58e3e54aa09a6708282022f6",
      title: "some title",
      medium: "Painting and something else",
      category: "Painting",
      artist: {
        _id: "artist-id",
      },
    },
  ],
  headers: {
    "x-total-count": "10",
  },
}

const mockVortexResponse = [
  {
    artistId: "artist-id",
    demandRank: 0.64,
    medium: "Print",
    annualLotsSold: 25,
    annualValueSoldCents: 577662200012,
    lastAuctionResultDate: "2022-06-15T00:00:00Z",
    medianSalePriceLast36Months: 577662200012,
    liquidityRank: 0.9,
  },
  {
    artistId: "artist-id",
    demandRank: 0.64,
    medium: "Painting",
    annualLotsSold: 10,
    annualValueSoldCents: 2176421231,
    lastAuctionResultDate: "2023-06-15T00:00:00Z",
    medianSalePriceLast36Months: 577662200012,
    liquidityRank: 0.5,
  },
]
