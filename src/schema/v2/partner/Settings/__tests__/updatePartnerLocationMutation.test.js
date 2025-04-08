import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerLocationMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerLocation(
        input: { partnerId: "foo", locationId: "bar", address: "456 New Drive" }
      ) {
        partnerLocationOrError {
          __typename
          ... on UpdatePartnerLocationSuccess {
            location {
              internalID
              address
            }
          }
          ... on UpdatePartnerLocationFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates the partner location", async () => {
    const context = {
      updatePartnerLocationLoader: () =>
        Promise.resolve({
          id: "bar",
          address: "456 New Drive",
        }),
    }

    const updatedPartner = await runAuthenticatedQuery(mutation, context)

    expect(updatedPartner).toEqual({
      updatePartnerLocation: {
        partnerLocationOrError: {
          __typename: "UpdatePartnerLocationSuccess",
          location: {
            internalID: "bar",
            address: "456 New Drive",
          },
        },
      },
    })
  })

  describe("when failure", () => {
    it("returns an error", async () => {
      const context = {
        updatePartnerLocationLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/partners/foo/location/bar - {"type":"error","message":"Location not found"}`
            )
          ),
      }

      const updatedPartner = await runAuthenticatedQuery(mutation, context)

      expect(updatedPartner).toEqual({
        updatePartnerLocation: {
          partnerLocationOrError: {
            __typename: "UpdatePartnerLocationFailure",
            mutationError: {
              message: "Location not found",
            },
          },
        },
      })
    })
  })
})
