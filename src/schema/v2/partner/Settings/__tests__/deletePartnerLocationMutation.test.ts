import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeletePartnerLocationMutation", () => {
  const mutation = gql`
    mutation {
      deletePartnerLocation(input: { partnerId: "foo", locationId: "bar" }) {
        partnerLocationOrError {
          __typename
          ... on DeletePartnerLocationSuccess {
            location {
              internalID
            }
          }
          ... on DeletePartnerLocationFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("deletes the partner location", async () => {
    const context = {
      deletePartnerLocationLoader: () =>
        Promise.resolve({
          id: "bar",
        }),
    }

    const deletedPartner = await runAuthenticatedQuery(mutation, context)

    expect(deletedPartner).toEqual({
      deletePartnerLocation: {
        partnerLocationOrError: {
          __typename: "DeletePartnerLocationSuccess",
          location: {
            internalID: "bar",
          },
        },
      },
    })
  })

  describe("when failure", () => {
    it("returns an error", async () => {
      const context = {
        deletePartnerLocationLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/partners/foo/location/bar - {"type":"error","message":"Location not found"}`
            )
          ),
      }

      const deletedPartner = await runAuthenticatedQuery(mutation, context)

      expect(deletedPartner).toEqual({
        deletePartnerLocation: {
          partnerLocationOrError: {
            __typename: "DeletePartnerLocationFailure",
            mutationError: {
              message: "Location not found",
            },
          },
        },
      })
    })
  })
})
