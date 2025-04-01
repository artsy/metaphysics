import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeletePartnerContactMutation", () => {
  const mutation = gql`
    mutation {
      deletePartnerContact(input: { partnerId: "foo", contactId: "bar" }) {
        partnerContactOrError {
          __typename
          ... on DeletePartnerContactSuccess {
            partnerContact {
              internalID
            }
          }
          ... on DeletePartnerContactFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("deletes the partner contact", async () => {
    const context = {
      deletePartnerContactLoader: () =>
        // Gravity returns id as it is PSQL backed
        Promise.resolve({
          id: "bar",
        }),
    }

    const deletedPartner = await runAuthenticatedQuery(mutation, context)

    expect(deletedPartner).toEqual({
      deletePartnerContact: {
        partnerContactOrError: {
          __typename: "DeletePartnerContactSuccess",
          partnerContact: {
            internalID: "bar",
          },
        },
      },
    })
  })

  describe("when failure", () => {
    it("returns an error", async () => {
      const context = {
        deletePartnerContactLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/partners/foo/contact/bar - {"type":"error","message":"Contact not found"}`
            )
          ),
      }

      const deletedPartner = await runAuthenticatedQuery(mutation, context)

      expect(deletedPartner).toEqual({
        deletePartnerContact: {
          partnerContactOrError: {
            __typename: "DeletePartnerContactFailure",
            mutationError: {
              message: "Contact not found",
            },
          },
        },
      })
    })
  })
})
