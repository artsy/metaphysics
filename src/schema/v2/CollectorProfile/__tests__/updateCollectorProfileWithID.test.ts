/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("UpdateCollectorProfileWithID", () => {
  it("calls the expected loader with correctly formatted params", async () => {
    const mutation = gql`
      mutation {
        updateCollectorProfileWithID(
          input: {
            companyName: "Cool Art Stuff"
            companyWebsite: "https://artsy.net"
            clientMutationId: "123"
            id: "3"
            professionalBuyer: true
            loyaltyApplicant: true
            selfReportedPurchases: "trust me i buy art"
            intents: [BUY_ART_AND_DESIGN]
            institutionalAffiliations: "example"
          }
        ) {
          collectorProfileOrError {
            __typename
            ... on UpdateCollectorProfileWithIDSuccess {
              collectorProfile {
                companyName
                companyWebsite
                professionalBuyerAt
                internalID
                name
                email
                selfReportedPurchases
                intents
              }
            }
            ... on UpdateCollectorProfileWithIDFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    const updateCollectorProfileLoaderResponse = {
      company_name: "Cool Art Stuff",
      company_website: "https://artsy.net",
      professional_buyer_at: "2022-08-15T11:14:55+00:00",
      id: "3",
      name: "Percy",
      email: "percy@cat.com",
      self_reported_purchases: "treats",
      intents: ["buy art & design"],
    }

    const context = {
      updateCollectorProfileLoader: () =>
        Promise.resolve(updateCollectorProfileLoaderResponse),
    }

    expect.assertions(1)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      updateCollectorProfileWithID: {
        collectorProfileOrError: {
          __typename: "UpdateCollectorProfileWithIDSuccess",
          collectorProfile: {
            companyName: "Cool Art Stuff",
            companyWebsite: "https://artsy.net",
            professionalBuyerAt: "2022-08-15T11:14:55+00:00",
            internalID: "3",
            name: "Percy",
            email: "percy@cat.com",
            selfReportedPurchases: "treats",
            intents: ["buy art & design"],
          },
        },
      },
    })
  })

  it("throws error when data loader is missing", async () => {
    const mutation = `
      mutation {
        updateCollectorProfile(input: { professionalBuyer: true, loyaltyApplicant: true, selfReportedPurchases: "trust me i buy art" }) {
          internalID
          name
          email
          selfReportedPurchases
          intents
        }
      }
    `

    const errorResponse =
      "Missing Update Collector Profile Loader. Check your access token."

    expect.assertions(1)

    try {
      await runQuery(mutation)
      throw new Error("An error was not thrown but was expected.")
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect, jest/no-try-expect
      expect(error.message).toEqual(errorResponse)
    }
  })

  it("returns a GravityMutationError when invalid param is used", async () => {
    const mutation = gql`
      mutation {
        updateCollectorProfileWithID(input: { companyWebsite: "artsy.net" }) {
          collectorProfileOrError {
            __typename
            ... on UpdateCollectorProfileWithIDSuccess {
              collectorProfile {
                companyWebsite
              }
            }
            ... on UpdateCollectorProfileWithIDFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    const context = {
      updateCollectorProfileLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/collector_profile/634d721a15077b000eb7e7cf?company_website=artsy.net - {"type":"param_error","message":"Company website url is not valid"}`
          )
        ),
    }

    expect.assertions(1)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      updateCollectorProfileWithID: {
        collectorProfileOrError: {
          __typename: "UpdateCollectorProfileWithIDFailure",
          mutationError: {
            message: "Company website url is not valid",
          },
        },
      },
    })
  })
})
