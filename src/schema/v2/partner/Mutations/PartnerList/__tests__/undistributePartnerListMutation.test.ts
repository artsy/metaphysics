import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UndistributePartnerListMutation", () => {
  const mutation = gql`
    mutation {
      undistributePartnerList(input: { id: "list-abc" }) {
        partnerListOrError {
          __typename
          ... on UndistributePartnerListSuccess {
            partnerList {
              partnerShowID
              distributionStatus
            }
          }
          ... on UndistributePartnerListFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("returns the list to private", async () => {
    const context = {
      undistributePartnerListLoader: jest.fn().mockResolvedValue({
        id: "list-abc",
        name: "Spring Show",
        list_type: "show",
        artworks_count: 3,
        partner_show_id: null,
        distribution_status: "none",
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.undistributePartnerListLoader).toHaveBeenCalledWith(
      "list-abc"
    )
    expect(result.undistributePartnerList.partnerListOrError).toEqual({
      __typename: "UndistributePartnerListSuccess",
      partnerList: { partnerShowID: null, distributionStatus: "NONE" },
    })
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      undistributePartnerListLoader: jest.fn().mockRejectedValue({
        body: { message: "List has not been distributed" },
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.undistributePartnerList.partnerListOrError).toEqual({
      __typename: "UndistributePartnerListFailure",
      mutationError: { message: "List has not been distributed" },
    })
  })
})
