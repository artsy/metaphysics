import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    createPartnerLocation(
      input: {
        partnerId: "partner_123"
        address: "123 Happy Lane"
        address2: "Apt 2b"
        city: "New York"
        state: "NY"
        postalCode: "10013"
        publiclyViewable: true
        email: "jane@example.com"
        phone: "123-456-7890"
      }
    ) {
      partnerLocationOrError {
        __typename
        ... on CreatePartnerLocationSuccess {
          location {
            internalID
            display
            publiclyViewable
          }
        }
        ... on CreatePartnerLocationFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("CreatePartnerLocationMutation", () => {
  describe("when successful", () => {
    const partnerLocation = {
      id: "location_123",
      address: "123 Happy Lane",
      address_2: "Apt 2b",
      city: "New York",
      state: "NY",
      postal_code: "10013",
      phone: "123-456-7890",
      publicly_viewable: true,
    }

    const context = {
      createPartnerLocationLoader: () => Promise.resolve(partnerLocation),
    }

    it("creates a partner location", async () => {
      const data = await runAuthenticatedQuery(mutation, context)
      expect(data).toEqual({
        createPartnerLocation: {
          partnerLocationOrError: {
            __typename: "CreatePartnerLocationSuccess",
            location: {
              internalID: "location_123",
              display: "123 Happy Lane, Apt 2b, New York, NY, 10013",
              publiclyViewable: true,
            },
          },
        },
      })
    })
  })

  describe("when failure", () => {
    it("returns an error", async () => {
      const context = {
        createPartnerLocationLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/partner/:id/location - {"type":"error","message":"Partner not found"}`
            )
          ),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        createPartnerLocation: {
          partnerLocationOrError: {
            __typename: "CreatePartnerLocationFailure",
            mutationError: {
              message: "Partner not found",
            },
          },
        },
      })
    })
  })
})
