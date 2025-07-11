import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("BulkAddArtworksToShowMutation", () => {
  const mutation = gql`
    mutation {
      bulkAddArtworksToShow(
        input: {
          id: "partner123"
          showId: "show456"
          filters: {
            artworkIds: ["artwork1", "artwork2"]
            availability: FOR_SALE
            locationId: "oldLocation"
            partnerArtistId: "artist789"
            published: true
          }
        }
      ) {
        bulkAddArtworksToShowOrError {
          __typename
          ... on BulkAddArtworksToShowMutationSuccess {
            updatedPartnerArtworks {
              count
              ids
            }
            skippedPartnerArtworks {
              count
              ids
            }
          }
          ... on BulkAddArtworksToShowMutationFailure {
            mutationError {
              error
              message
            }
          }
        }
      }
    }
  `

  it("adds multiple artworks to a given show", async () => {
    const context = {
      addArtworksToShowLoader: jest.fn().mockResolvedValue({
        success: 2,
        errors: {
          count: 1,
          ids: ["artwork3"],
        },
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.addArtworksToShowLoader).toHaveBeenCalledWith("partner123", {
      show_id: "show456",
      filters: {
        artwork_ids: ["artwork1", "artwork2"],
        availability: "for sale",
        location_id: "oldLocation",
        partner_artist_id: "artist789",
        published: true,
      },
    })

    expect(result).toEqual({
      bulkAddArtworksToShow: {
        bulkAddArtworksToShowOrError: {
          __typename: "BulkAddArtworksToShowMutationSuccess",
          updatedPartnerArtworks: {
            count: 2,
            ids: [],
          },
          skippedPartnerArtworks: {
            count: 1,
            ids: ["artwork3"],
          },
        },
      },
    })
  })

  it("respects the filter parameters", async () => {
    const mutationWithFilterOnly = gql`
      mutation {
        bulkAddArtworksToShow(
          input: {
            id: "partner123"
            showId: "show456"
            filters: { partnerArtistId: "artist789" }
          }
        ) {
          bulkAddArtworksToShowOrError {
            __typename
          }
        }
      }
    `

    const context = {
      addArtworksToShowLoader: jest.fn().mockResolvedValue({
        success: 5,
        errors: {
          count: 0,
          ids: [],
        },
      }),
    }

    await runAuthenticatedQuery(mutationWithFilterOnly, context)

    expect(context.addArtworksToShowLoader).toHaveBeenCalledWith("partner123", {
      show_id: "show456",
      filters: {
        partner_artist_id: "artist789",
      },
    })
  })

  it("handles gravity API errors gracefully", async () => {
    const context = {
      addArtworksToShowLoader: () =>
        Promise.reject(new HTTPError(`Forbidden`, 403, "Gravity Error")),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      bulkAddArtworksToShow: {
        bulkAddArtworksToShowOrError: {
          __typename: "BulkAddArtworksToShowMutationFailure",
          mutationError: {
            error: null,
            message: "Gravity Error",
          },
        },
      },
    })
  })
})
