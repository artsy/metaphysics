import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("ArtsyShippingOptInMutation", () => {
  const mutation = gql`
    mutation {
      artsyShippingOptIn(
        input: {
          id: "partner123"
          artsyShippingDomestic: true
          artsyShippingInternational: false
        }
      ) {
        ArtsyShippingOptInOrError {
          __typename
          ... on ArtsyShippingOptInMutationSuccess {
            updatedPartnerArtworks {
              count
              ids
            }
            skippedPartnerArtworks {
              count
              ids
            }
          }
          ... on ArtsyShippingOptInMutationFailure {
            mutationError {
              error
              message
            }
          }
        }
      }
    }
  `

  it("successfully updates partner artworks shipping options", async () => {
    const context = {
      artsyShippingOptInLoader: jest.fn().mockResolvedValue({
        success: 10,
        errors: {
          count: 2,
          ids: ["artwork1", "artwork2"],
        },
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.artsyShippingOptInLoader).toHaveBeenCalledWith(
      "partner123",
      {
        artsy_shipping_domestic: true,
        artsy_shipping_international: false,
      }
    )

    expect(result).toEqual({
      artsyShippingOptIn: {
        ArtsyShippingOptInOrError: {
          __typename: "ArtsyShippingOptInMutationSuccess",
          updatedPartnerArtworks: {
            count: 10,
            ids: [],
          },
          skippedPartnerArtworks: {
            count: 2,
            ids: ["artwork1", "artwork2"],
          },
        },
      },
    })
  })

  it("throws error when user is not authenticated", async () => {
    const context = {
      artsyShippingOptInLoader: undefined,
    }

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  it("handles gravity API errors gracefully", async () => {
    const context = {
      artsyShippingOptInLoader: () =>
        Promise.reject(new HTTPError(`Forbidden`, 403, "Gravity Error")),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      artsyShippingOptIn: {
        ArtsyShippingOptInOrError: {
          __typename: "ArtsyShippingOptInMutationFailure",
          mutationError: {
            error: null,
            message: "Gravity Error",
          },
        },
      },
    })
  })
})
