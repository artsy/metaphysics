import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerFlagsMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerFlags(input: { id: "partner-id", flags: { feature_1: "enabled", feature_2: "" } }) {
        partnerOrError {
          __typename
          ... on UpdatePartnerFlagsSuccess {
            partner {
              internalID
            }
          }
          ... on UpdatePartnerFlagsFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates multiple partner flags", async () => {
    const context = {
      updatePartnerFlagsLoader: jest.fn((id, { flags }) => {
        expect(id).toEqual("partner-id")
        expect(flags).toEqual({ feature_1: "enabled", feature_2: "" })
        return Promise.resolve({
          _id: "partner-id",
        })
      }),
    }

    const updatedPartner = await runAuthenticatedQuery(mutation, context)

    expect(updatedPartner).toEqual({
      updatePartnerFlags: {
        partnerOrError: {
          __typename: "UpdatePartnerFlagsSuccess",
          partner: {
            internalID: "partner-id",
          },
        },
      },
    })
  })

  describe("when failure", () => {
    it("returns an error", async () => {
      const context = {
        updatePartnerFlagsLoader: jest.fn((_id, _params) =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/partner/partner-id/partner_flags - {"type":"error","message":"Error updating partner flags"}`
            )
          )
        ),
      }

      const updatedPartner = await runAuthenticatedQuery(mutation, context)

      expect(updatedPartner).toEqual({
        updatePartnerFlags: {
          partnerOrError: {
            __typename: "UpdatePartnerFlagsFailure",
            mutationError: {
              message: "Error updating partner flags",
            },
          },
        },
      })
    })
  })
})