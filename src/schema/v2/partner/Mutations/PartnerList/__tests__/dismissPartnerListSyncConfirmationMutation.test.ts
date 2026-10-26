import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DismissPartnerListSyncConfirmationMutation", () => {
  const mutation = gql`
    mutation {
      dismissPartnerListSyncConfirmation(input: { id: "list-abc" }) {
        partnerListOrError {
          __typename
          ... on DismissPartnerListSyncConfirmationSuccess {
            partnerList {
              syncConfirmationDismissed
            }
          }
          ... on DismissPartnerListSyncConfirmationFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("dismisses the confirmation", async () => {
    const context = {
      dismissPartnerListSyncConfirmationLoader: jest.fn().mockResolvedValue({
        id: "list-abc",
        name: "Spring Show",
        list_type: "show",
        artworks_count: 3,
        sync_confirmation_dismissed: true,
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      context.dismissPartnerListSyncConfirmationLoader
    ).toHaveBeenCalledWith("list-abc")
    expect(
      result.dismissPartnerListSyncConfirmation.partnerListOrError
    ).toEqual({
      __typename: "DismissPartnerListSyncConfirmationSuccess",
      partnerList: { syncConfirmationDismissed: true },
    })
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      dismissPartnerListSyncConfirmationLoader: jest.fn().mockRejectedValue({
        body: { message: "Partner list not found" },
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.dismissPartnerListSyncConfirmation.partnerListOrError
    ).toEqual({
      __typename: "DismissPartnerListSyncConfirmationFailure",
      mutationError: { message: "Partner list not found" },
    })
  })
})
