import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    createPartnerContact(
      input: {
        partnerID: "partner_123"
        name: "Jane Doe"
        position: "Manager"
        canContact: true
        email: "jane@example.com"
        phone: "123-456-7890"
        locationID: "location_567"
      }
    ) {
      partnerContactOrError {
        __typename
        ... on CreatePartnerContactSuccess {
          partnerContact {
            internalID
            name
            canContact
            position
            email
            phone
          }
        }
        ... on CreatePartnerContactFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("CreatePartnerContactMutation", () => {
  describe("when successful", () => {
    const partnerContact = {
      _id: "contact_123",
      name: "Jane Doe",
      position: "Manager",
      can_contact: true,
      email: "jane@example.com",
      phone: "123-456-7890",
      location_id: "location_567",
    }

    const context = {
      createPartnerContactLoader: () => Promise.resolve(partnerContact),
    }

    it("creates a partner contact", async () => {
      const data = await runAuthenticatedQuery(mutation, context)
      expect(data).toEqual({
        createPartnerContact: {
          partnerContactOrError: {
            __typename: "CreatePartnerContactSuccess",
            partnerContact: {
              internalID: "contact_123",
              name: "Jane Doe",
              position: "Manager",
              canContact: true,
              email: "jane@example.com",
              phone: "123-456-7890",
            },
          },
        },
      })
    })
  })

  describe("when failure", () => {
    it("returns an error", async () => {
      const context = {
        createPartnerContactLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/partner_contact - {"type":"error","message":"Partner not found"}`
            )
          ),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        createPartnerContact: {
          partnerContactOrError: {
            __typename: "CreatePartnerContactFailure",
            mutationError: {
              message: "Partner not found",
            },
          },
        },
      })
    })
  })
})
