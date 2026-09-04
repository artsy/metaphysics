import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("BulkDeleteArtworksMutation", () => {
  const mutation = gql`
    mutation {
      bulkDeleteArtworks(
        input: {
          id: "partner123"
          source: ARTWORKS_LIST
          filters: {
            artworkIds: ["artwork1", "artwork2"]
            availability: FOR_SALE
            locationId: "location456"
            partnerArtistId: "artist789"
            published: true
          }
        }
      ) {
        bulkDeleteArtworksOrError {
          __typename
          ... on BulkDeleteArtworksMutationSuccess {
            deletedPartnerArtworks {
              count
              ids
            }
            skippedPartnerArtworks {
              count
              ids
            }
          }
          ... on BulkDeleteArtworksMutationFailure {
            mutationError {
              error
              message
            }
          }
        }
      }
    }
  `

  it("deletes multiple artworks", async () => {
    const context = {
      deletePartnerArtworksLoader: jest.fn().mockResolvedValue({
        success: 0,
        errors: {
          count: 0,
          ids: [],
        },
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.deletePartnerArtworksLoader).toHaveBeenCalledWith(
      "partner123",
      {
        source: "artworks_list",
        filters: {
          artwork_ids: ["artwork1", "artwork2"],
          availability: "for sale",
          location_id: "location456",
          partner_artist_id: "artist789",
          artist_id: undefined,
          published: true,
        },
      }
    )

    expect(result).toEqual({
      bulkDeleteArtworks: {
        bulkDeleteArtworksOrError: {
          __typename: "BulkDeleteArtworksMutationSuccess",
          deletedPartnerArtworks: {
            count: 0,
            ids: [],
          },
          skippedPartnerArtworks: {
            count: 0,
            ids: [],
          },
        },
      },
    })
  })

  it("respects a subset of filter parameters", async () => {
    const mutationWithArtistFilter = gql`
      mutation {
        bulkDeleteArtworks(
          input: {
            id: "partner123"
            source: INVENTORY
            filters: { partnerArtistId: "artist789" }
          }
        ) {
          bulkDeleteArtworksOrError {
            __typename
          }
        }
      }
    `

    const context = {
      deletePartnerArtworksLoader: jest.fn().mockResolvedValue({
        success: 0,
        errors: { count: 0, ids: [] },
      }),
    }

    await runAuthenticatedQuery(mutationWithArtistFilter, context)

    expect(context.deletePartnerArtworksLoader).toHaveBeenCalledWith(
      "partner123",
      {
        source: "os_inventory",
        filters: {
          partner_artist_id: "artist789",
          artist_id: undefined,
          availability: undefined,
          artwork_ids: undefined,
          location_id: undefined,
          published: undefined,
        },
      }
    )
  })

  it("handles gravity API errors gracefully", async () => {
    const context = {
      deletePartnerArtworksLoader: () =>
        Promise.reject(new HTTPError(`Forbidden`, 403, "Gravity Error")),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      bulkDeleteArtworks: {
        bulkDeleteArtworksOrError: {
          __typename: "BulkDeleteArtworksMutationFailure",
          mutationError: {
            error: null,
            message: "Gravity Error",
          },
        },
      },
    })
  })
})
