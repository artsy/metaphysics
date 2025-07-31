import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("UpdatePartnerFlagsMutation", () => {
  describe("with all flag types", () => {
    const mutationWithAllFlags = gql`
      mutation {
        updatePartnerFlags(
          input: {
            id: "partner-id"
            inquireAvailabilityPriceDisplayEnabledByPartner: true
            artworksDefaultMetric: "cm"
            artworksDefaultCurrency: "USD"
            artworksDefaultPartnerLocationId: "location-1"
            artworksDefaultWeightMetric: "kg"
          }
        ) {
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

    it("updates all partner flags", async () => {
      const context = {
        updatePartnerFlagsLoader: jest.fn((id, { flags }) => {
          expect(id).toEqual("partner-id")
          expect(flags).toEqual({
            inquire_availability_price_display_enabled_by_partner: true,
            artworks_default_metric: "cm",
            artworks_default_currency: "USD",
            artworks_default_partner_location_id: "location-1",
            artworksDefaultWeightMetric: "kg",
          })
          return Promise.resolve({
            _id: "partner-id",
          })
        }),
      }

      const updatedPartner = await runAuthenticatedQuery(
        mutationWithAllFlags,
        context
      )

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
  })

  describe("with subset of flags", () => {
    const mutationWithSubsetOfFlags = gql`
      mutation {
        updatePartnerFlags(
          input: {
            id: "partner-id"
            inquireAvailabilityPriceDisplayEnabledByPartner: true
            artworksDefaultCurrency: "EUR"
          }
        ) {
          partnerOrError {
            __typename
            ... on UpdatePartnerFlagsSuccess {
              partner {
                internalID
              }
            }
          }
        }
      }
    `

    it("updates only specified partner flags", async () => {
      const context = {
        updatePartnerFlagsLoader: jest.fn((id, { flags }) => {
          expect(id).toEqual("partner-id")
          expect(flags).toEqual({
            inquire_availability_price_display_enabled_by_partner: true,
            artworks_default_currency: "EUR",
          })
          // Make sure other flags are not included
          expect(flags).not.toHaveProperty("artworks_default_metric")
          expect(flags).not.toHaveProperty(
            "artworks_default_partner_location_id"
          )
          expect(flags).not.toHaveProperty("artworks_default_weight_metric")
          return Promise.resolve({
            _id: "partner-id",
          })
        }),
      }

      const updatedPartner = await runAuthenticatedQuery(
        mutationWithSubsetOfFlags,
        context
      )

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
  })

  describe("with null flag values", () => {
    const mutationWithNullFlags = gql`
      mutation {
        updatePartnerFlags(
          input: {
            id: "partner-id"
            inquireAvailabilityPriceDisplayEnabledByPartner: null
            artworksDefaultMetric: null
            artworksDefaultWeightMetric: null
          }
        ) {
          partnerOrError {
            __typename
            ... on UpdatePartnerFlagsSuccess {
              partner {
                internalID
              }
            }
          }
        }
      }
    `

    it("unsets flags when explicitly set to null", async () => {
      const context = {
        updatePartnerFlagsLoader: jest.fn((id, { flags }) => {
          expect(id).toEqual("partner-id")
          expect(flags).toEqual({
            inquire_availability_price_display_enabled_by_partner: null,
            artworks_default_metric: null,
            artworks_default_weight_metric: null,
          })
          return Promise.resolve({
            _id: "partner-id",
          })
        }),
      }

      const updatedPartner = await runAuthenticatedQuery(
        mutationWithNullFlags,
        context
      )

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
  })

  describe("with no authorization", () => {
    const mutation = gql`
      mutation {
        updatePartnerFlags(
          input: {
            id: "partner-id"
            inquireAvailabilityPriceDisplayEnabledByPartner: true
          }
        ) {
          partnerOrError {
            __typename
            ... on UpdatePartnerFlagsFailure {
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
        updatePartnerFlags(
          input: {
            id: "partner-id"
            inquireAvailabilityPriceDisplayEnabledByPartner: true
          }
        ) {
          partnerOrError {
            __typename
            ... on UpdatePartnerFlagsFailure {
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
