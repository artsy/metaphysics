import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerFlagsMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerFlags(input: { id: "25" }) {
        partnerOrError {
          __typename
          ... on updatePartnerFlagsSuccess {
            partner {
              internalID
            }
          }
          ... on updatePartnerFlagsFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates an partner flags", async () => {
    const context = {
      updatePartnerFlagsLoader: () =>
        Promise.resolve({
          _id: "foo",
        }),
    }

    const updatedPartner = await runAuthenticatedQuery(mutation, context)

    expect(updatedPartner).toEqual({
      updatePartnerFlags: {
        partnerOrError: {
          __typename: "updatePartnerFlagsSuccess",
          partner: {
            internalID: "foo",
          },
        },
      },
    })
  })

  describe("when failure", () => {
    it("returns an error", async () => {
      const context = {
        updatePartnerFlagsLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/partners/flags - {"type":"error","message":"Error from API"}`
            )
          ),
      }

      const updatedPartner = await runAuthenticatedQuery(mutation, context)

      expect(updatedPartner).toEqual({
        updatePartnerFlags: {
          partnerOrError: {
            __typename: "updatePartnerFlagsFailure",
            mutationError: {
              message: "Error from API",
            },
          },
        },
      })
    })
  })
})
