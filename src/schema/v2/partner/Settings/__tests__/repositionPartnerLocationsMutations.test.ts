import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("RepositionPartnerLocationMutation", () => {
  const mutation = gql`
    mutation {
      repositionPartnerLocations(
        input: {
          partnerId: "partner456"
          locationIds: ["nyc-location-1", "astoria-location-2"]
        }
      ) {
        partnerOrError {
          __typename
          ... on RepositionPartnerLocationsSuccess {
            partner {
              internalID
              name
            }
          }
          ... on RepositionPartnerLocationsFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("reorders list of partner locations", async () => {
    const context = {
      repositionPartnerLocationsLoader: () => {
        return Promise.resolve({
          _id: "partner456",
          name: "Partner 456",
        })
      },
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      repositionPartnerLocations: {
        partnerOrError: {
          __typename: "RepositionPartnerLocationsSuccess",
          partner: {
            internalID: "partner456",
            name: "Partner 456",
          },
        },
      },
    })
  })
})
