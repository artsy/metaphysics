import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateCMSLastAccessTimestampMutation", () => {
  const mutation = gql`
    mutation {
      updateCMSLastAccessTimestamp(input: { id: "25" }) {
        partnerOrError {
          __typename
          ... on UpdateCMSLastAccessTimestampSuccess {
            partner {
              internalID
            }
          }
          ... on UpdateCMSLastAccessTimestampFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates CMS last access timestamp", async () => {
    const context = {
      updatePartnerFlagsLoader: () =>
        Promise.resolve({
          _id: "foo",
        }),
    }

    const updatedPartner = await runAuthenticatedQuery(mutation, context)

    expect(updatedPartner).toEqual({
      updateCMSLastAccessTimestamp: {
        partnerOrError: {
          __typename: "UpdateCMSLastAccessTimestampSuccess",
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
        updateCMSLastAccessTimestamp: {
          partnerOrError: {
            __typename: "UpdateCMSLastAccessTimestampFailure",
            mutationError: {
              message: "Error from API",
            },
          },
        },
      })
    })
  })
})
