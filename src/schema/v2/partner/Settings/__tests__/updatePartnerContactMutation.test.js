import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerContactMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerContact(
        input: { partnerId: "foo", contactId: "bar", email: "test@test.com" }
      ) {
        partnerContactOrError {
          __typename
          ... on UpdatePartnerContactSuccess {
            partnerContact {
              internalID
              email
            }
          }
          ... on UpdatePartnerContactFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates the partner contact", async () => {
    const context = {
      updatePartnerContactLoader: () =>
        Promise.resolve({
          _id: "bar",
          email: "test@test.com",
        }),
    }

    const updatedPartner = await runAuthenticatedQuery(mutation, context)

    expect(updatedPartner).toEqual({
      updatePartnerContact: {
        partnerContactOrError: {
          __typename: "UpdatePartnerContactSuccess",
          partnerContact: {
            internalID: "bar",
            email: "test@test.com",
          },
        },
      },
    })
  })

  describe("when failure", () => {
    it("returns an error", async () => {
      const context = {
        updatePartnerContactLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/partners/foo/contact/bar - {"type":"error","message":"Contact not found"}`
            )
          ),
      }

      const updatedPartner = await runAuthenticatedQuery(mutation, context)

      expect(updatedPartner).toEqual({
        updatePartnerContact: {
          partnerContactOrError: {
            __typename: "UpdatePartnerContactFailure",
            mutationError: {
              message: "Contact not found",
            },
          },
        },
      })
    })
  })
})
