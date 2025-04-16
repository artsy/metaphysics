import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("UpdatePartnerMutation", () => {
  describe("with multiple fields", () => {
    const mutationWithMultipleFields = gql`
      mutation {
        updatePartner(
          input: {
            id: "partner-id"
            displayName: "Updated Gallery Name"
            email: "contact@gallery.com"
            website: "https://gallery.com"
            hasFullProfile: true
          }
        ) {
          partnerOrError {
            __typename
            ... on UpdatePartnerSuccess {
              partner {
                internalID
                name
              }
            }
            ... on UpdatePartnerFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    it("updates multiple partner fields", async () => {
      const context = {
        updatePartnerLoader: jest.fn((id, partnerData) => {
          expect(id).toEqual("partner-id")
          expect(partnerData).toEqual({
            display_name: "Updated Gallery Name",
            email: "contact@gallery.com",
            website: "https://gallery.com",
            has_full_profile: true,
          })
          return Promise.resolve({
            _id: "partner-id",
            name: "Updated Gallery Name",
          })
        }),
      }

      const updatedPartner = await runAuthenticatedQuery(
        mutationWithMultipleFields,
        context
      )

      expect(updatedPartner).toEqual({
        updatePartner: {
          partnerOrError: {
            __typename: "UpdatePartnerSuccess",
            partner: {
              internalID: "partner-id",
              name: "Updated Gallery Name",
            },
          },
        },
      })
    })
  })

  describe("with null field values", () => {
    const mutationWithNullFields = gql`
      mutation {
        updatePartner(input: { id: "partner-id", email: null, website: null }) {
          partnerOrError {
            __typename
            ... on UpdatePartnerSuccess {
              partner {
                internalID
              }
            }
          }
        }
      }
    `

    it("unsets fields when explicitly set to null", async () => {
      const context = {
        updatePartnerLoader: jest.fn((id, partnerData) => {
          expect(id).toEqual("partner-id")
          expect(partnerData).toEqual({
            email: null,
            website: null,
          })
          return Promise.resolve({
            _id: "partner-id",
          })
        }),
      }

      const updatedPartner = await runAuthenticatedQuery(
        mutationWithNullFields,
        context
      )

      expect(updatedPartner).toEqual({
        updatePartner: {
          partnerOrError: {
            __typename: "UpdatePartnerSuccess",
            partner: {
              internalID: "partner-id",
            },
          },
        },
      })
    })
  })

  describe("with no authorization", () => {
    const mutation = gql`
      mutation {
        updatePartner(
          input: { id: "partner-id", displayName: "Updated Gallery Name" }
        ) {
          partnerOrError {
            __typename
            ... on UpdatePartnerFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    it("returns an authorization error when no loader is available", async () => {
      // Use runQuery without any loaders to simulate unauthenticated request
      try {
        await runQuery(mutation, {})
        // If we get here, the test should fail
        throw new Error("An error was not thrown but was expected")
      } catch (error) {
        // Verify the error is related to authentication
        expect(error.message).toContain("signed in")
      }
    })
  })

  describe("when API failure occurs", () => {
    const mutation = gql`
      mutation {
        updatePartner(
          input: { id: "partner-id", displayName: "Updated Gallery Name" }
        ) {
          partnerOrError {
            __typename
            ... on UpdatePartnerFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    it("returns an error", async () => {
      const context = {
        updatePartnerLoader: jest.fn((_id, _partnerData) =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/partner/partner-id - {"type":"error","message":"Error updating partner"}`
            )
          )
        ),
      }

      const updatedPartner = await runAuthenticatedQuery(mutation, context)

      expect(updatedPartner).toEqual({
        updatePartner: {
          partnerOrError: {
            __typename: "UpdatePartnerFailure",
            mutationError: {
              message: "Error updating partner",
            },
          },
        },
      })
    })
  })
})
