import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("me.myCollection", () => {
  const vortexGraphqlLoader = jest.fn(() => async () => mockVortexResponse)

  it("returns artworks for a collection", async () => {
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

      collectionArtworksLoader: () =>
        Promise.resolve({
          body: [
            {
              _id: "58e3e54aa09a6708282022f6",
              title: "some title",
              artist: {
                _id: "artist-id",
              },
            },
          ],
          headers: {
            "x-total-count": "10",
          },
        }),
      vortexGraphqlLoader,
      authenticatedArtistLoader: () =>
        Promise.resolve({
          _id: "artist-id",
        }),
    }

    const data = await runAuthenticatedQuery(query, context)
    expect(data.me.myCollectionConnection.edges[0].node.title).toBe(
      "some title"
    )
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
      collectionArtworksLoader: () =>
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
      vortexGraphqlLoader,
      authenticatedArtistLoader: () =>
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
      collectionArtworksLoader: () =>
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
      vortexGraphqlLoader,
      convectionGraphQLLoader: () =>
        Promise.resolve({
          submissions: {
            edges: [],
          } as any,
        }),
      authenticatedArtistLoader: () =>
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
                medium
                artist {
                  internalID
                }
                marketPriceInsights {
                  demandRank
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
      collectionArtworksLoader: () =>
        Promise.resolve({
          body: [
            {
              _id: "artwork_id_with_market_price_insights",
              id: "artwork_id_with_market_price_insights",
              title: "some title",
              medium: "Painting",
              artist: {
                _id: "artist-id",
              },
            },
          ],
          headers: {
            "x-total-count": "10",
          },
        }),
      vortexGraphqlLoader,
      authenticatedArtistLoader: () =>
        Promise.resolve({
          _id: "artist-id",
        }),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data.me.myCollectionConnection.edges[0].node.title).toBe(
      "some title"
    )

    expect(
      data.me.myCollectionConnection.edges[0].node.marketPriceInsights
        .demandRank
    ).toBe(0.64)
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
      collectionArtworksLoader: () =>
        Promise.reject(new Error("Collection Not Found")),
      vortexGraphqlLoader,
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
      collectionArtworksLoader: () =>
        Promise.reject(new Error("Some other error")),
      vortexGraphqlLoader,
    }

    expect.assertions(1)

    await expect(runAuthenticatedQuery(query, context)).rejects.toThrow(
      "Some other error"
    )
  })
})

const mockVortexResponse = {
  data: {
    marketPriceInsightsBatch: {
      totalCount: 1,
      edges: [
        {
          node: {
            artistId: "artist-id",
            demandRank: 0.64,
            medium: "Painting",
          },
        },
      ],
    },
  },
}
