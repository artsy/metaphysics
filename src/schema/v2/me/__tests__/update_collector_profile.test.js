/* eslint-disable promise/always-return */
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("UpdateCollectorProfile", () => {
  it("updates and returns a collector profile", async () => {
    const mutation = `
      mutation {
        updateCollectorProfile(input: { professionalBuyer: true, loyaltyApplicant: true, selfReportedPurchases: "trust me i buy art", intents: [BUY_ART_AND_DESIGN], institutionalAffiliations: "example" }) {
          internalID
          name
          email
          selfReportedPurchases
          intents
        }
      }
    `

    const mockUpdateCollectorProfileLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        id: "3",
        name: "Percy",
        email: "percy@cat.com",
        self_reported_purchases: "treats",
        intents: ["buy art & design"],
      })
    )

    const context = {
      updateCollectorProfileLoader: mockUpdateCollectorProfileLoader,
    }

    const expectedProfileData = {
      internalID: "3",
      name: "Percy",
      email: "percy@cat.com",
      selfReportedPurchases: "treats",
      intents: ["buy art & design"],
    }

    expect.assertions(2)

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
})
