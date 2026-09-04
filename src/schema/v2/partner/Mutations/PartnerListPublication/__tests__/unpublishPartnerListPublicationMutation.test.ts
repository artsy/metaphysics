import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UnpublishPartnerListPublicationMutation", () => {
  const mutation = gql`
    mutation {
      unpublishPartnerListPublication(input: { partnerListID: "list-abc" }) {
        partnerListPublicationOrError {
          __typename
          ... on UnpublishPartnerListPublicationSuccess {
            partnerListPublication {
              internalID
              published
            }
          }
          ... on UnpublishPartnerListPublicationFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("unpublishes a partner list publication", async () => {
    const context = {
      unpublishPartnerListPublicationLoader: jest.fn().mockResolvedValue({
        id: "pub-1",
        partner_list_id: "list-abc",
        published: false,
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.unpublishPartnerListPublicationLoader).toHaveBeenCalledWith(
      "list-abc"
    )

    expect(result).toEqual({
      unpublishPartnerListPublication: {
        partnerListPublicationOrError: {
          __typename: "UnpublishPartnerListPublicationSuccess",
          partnerListPublication: {
            internalID: "pub-1",
            published: false,
          },
        },
      },
    })
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      unpublishPartnerListPublicationLoader: jest
        .fn()
        .mockRejectedValue({ body: { error: "Publication Not Found" } }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      unpublishPartnerListPublication: {
        partnerListPublicationOrError: {
          __typename: "UnpublishPartnerListPublicationFailure",
          mutationError: {
            message: "Publication Not Found",
          },
        },
      },
    })
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        unpublishPartnerListPublicationLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
