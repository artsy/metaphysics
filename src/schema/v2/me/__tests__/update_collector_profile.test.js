/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateCollectorProfile", () => {
  it("calls the expected loader with correctly formatted params", async () => {
    const mutation = gql`
      mutation {
        updateCollectorProfile(
          input: {
            professionalBuyer: true
            loyaltyApplicant: true
            selfReportedPurchases: "trust me i buy art"
            intents: [BUY_ART_AND_DESIGN]
            institutionalAffiliations: "example"
            companyName: "Cool Art Stuff"
            companyWebsite: "https://artsy.net"
            promptedForUpdate: true
            linkedIn: "artsy"
            instagram: "@artsy"
          }
        ) {
          collectorProfileOrError {
            __typename
            ... on UpdateCollectorProfileSuccess {
              collectorProfile {
                internalID
                name
                email
                intents
                lastUpdatePromptAt
                linkedIn
                instagram
              }
            }
          }
        }
      }
    `

    const mockUpdateCollectorProfileLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        company_name: "Cool Art Stuff",
        company_website: "https://artsy.net",
        professional_buyer_at: "2022-08-15T11:14:55+00:00",
        id: "3",
        name: "Percy",
        email: "percy@cat.com",
        self_reported_purchases: "treats",
        intents: ["buy art & design"],
        last_update_prompt_at: "2022-08-15T11:14:55+00:00",
        linked_in: "artsy",
        instagram: "@artsy",
      })
    )

    const context = {
      meUpdateCollectorProfileLoader: mockUpdateCollectorProfileLoader,
    }

    const expectedProfileData = {
      collectorProfileOrError: {
        __typename: "UpdateCollectorProfileSuccess",
        collectorProfile: {
          internalID: "3",
          name: "Percy",
          email: "percy@cat.com",
          intents: ["buy art & design"],
          lastUpdatePromptAt: "2022-08-15T11:14:55+00:00",
          linkedIn: "artsy",
          instagram: "@artsy",
        },
      },
    }

    const { updateCollectorProfile } = await runAuthenticatedQuery(
      mutation,
      context
    )

    expect(updateCollectorProfile).toEqual(expectedProfileData)

    expect(mockUpdateCollectorProfileLoader).toBeCalledWith({
      intents: ["buy art & design"],
      loyalty_applicant: true,
      professional_buyer: true,
      self_reported_purchases: "trust me i buy art",
      institutional_affiliations: "example",
      company_name: "Cool Art Stuff",
      company_website: "https://artsy.net",
      prompted_for_update: true,
      linked_in: "artsy",
      instagram: "@artsy",
    })
  })

  it("returns updateClientId", async () => {
    const mutation = gql`
      mutation {
        updateCollectorProfile(
          input: { professionalBuyer: true, clientMutationId: "mutation-id" }
        ) {
          clientMutationId
        }
      }
    `

    const context = {
      meUpdateCollectorProfileLoader: jest.fn().mockReturnValue({}),
    }

    const { updateCollectorProfile } = await runAuthenticatedQuery(
      mutation,
      context
    )

    expect(updateCollectorProfile).toEqual({ clientMutationId: "mutation-id" })
  })

  it("successfully saves and reads back linkedIn and instagram fields", async () => {
    const updateMutation = gql`
      mutation {
        updateCollectorProfile(
          input: { linkedIn: "john-artlover", instagram: "@john_art" }
        ) {
          collectorProfileOrError {
            __typename
            ... on UpdateCollectorProfileSuccess {
              collectorProfile {
                internalID
                name
                linkedIn
                instagram
              }
            }
          }
        }
      }
    `

    const mockUpdateCollectorProfileLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        id: "collector-123",
        name: "John Artlover",
        linked_in: "john-artlover",
        instagram: "@john_art",
      })
    )

    const context = {
      meUpdateCollectorProfileLoader: mockUpdateCollectorProfileLoader,
    }

    const { updateCollectorProfile } = await runAuthenticatedQuery(
      updateMutation,
      context
    )

    // Verify the update mutation returns the correct data
    expect(updateCollectorProfile).toEqual({
      collectorProfileOrError: {
        __typename: "UpdateCollectorProfileSuccess",
        collectorProfile: {
          internalID: "collector-123",
          name: "John Artlover",
          linkedIn: "john-artlover",
          instagram: "@john_art",
        },
      },
    })

    // Verify the loader was called with correct snake_case parameters
    expect(mockUpdateCollectorProfileLoader).toBeCalledWith({
      linked_in: "john-artlover",
      instagram: "@john_art",
    })
  })

  it("throws an error given a missing data loader", async () => {
    const mutation = gql`
      mutation {
        updateCollectorProfile(input: { professionalBuyer: true }) {
          collectorProfileOrError {
            __typename
          }
        }
      }
    `

    const context = { meUpdateCollectorProfileLoader: undefined }

    await expect(
      runAuthenticatedQuery(mutation, context)
    ).rejects.toMatchInlineSnapshot(
      "[Error: Missing Update Collector Profile Loader. Check your access token.]"
    )
  })
})
