import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerShowMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerShow(
        input: { partnerId: "foo", showId: "bar", featured: true }
      ) {
        showOrError {
          __typename
          ... on UpdatePartnerShowSuccess {
            show {
              internalID
            }
          }
          ... on UpdatePartnerShowFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates the partner show featured field", async () => {
    const context = {
      updatePartnerShowLoader: () =>
        Promise.resolve({
          _id: "foo",
        }),
    }

    const updatedPartner = await runAuthenticatedQuery(mutation, context)

    expect(updatedPartner).toEqual({
      updatePartnerShow: {
        showOrError: {
          __typename: "UpdatePartnerShowSuccess",
          show: {
            internalID: "foo",
          },
        },
      },
    })
  })

  describe("when failure", () => {
    it("returns an error", async () => {
      const context = {
        updatePartnerShowLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/partners/foo/show/bar - {"type":"error","message":"Error from API"}`
            )
          ),
      }

      const updatedPartner = await runAuthenticatedQuery(mutation, context)

      expect(updatedPartner).toEqual({
        updatePartnerShow: {
          showOrError: {
            __typename: "UpdatePartnerShowFailure",
            mutationError: {
              message: "Error from API",
            },
          },
        },
      })
    })
  })
})
