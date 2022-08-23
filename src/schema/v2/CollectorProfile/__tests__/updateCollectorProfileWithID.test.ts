/* eslint-disable promise/always-return */
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("UpdateCollectorProfileWithID", () => {
  it("calls the expected loader with correctly formatted params", async () => {
    const mutation = `
        mutation {
          updateCollectorProfileWithID(input: { id: "5043b8888b3b8145d7005318", professionalBuyer: true, loyaltyApplicant: true, selfReportedPurchases: "trust me i buy art", intents: [BUY_ART_AND_DESIGN], institutionalAffiliations: "example", companyName: "Cool Art Stuff", companyWebsite: "https://artsy.net" }) {
            internalID
            name
            email
            selfReportedPurchases
            intents
            companyName
            companyWebsite
            professionalBuyerAt
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
      })
    )

    const context = {
      updateCollectorProfileLoader: mockUpdateCollectorProfileLoader,
    }

    const expectedProfileData = {
      companyName: "Cool Art Stuff",
      companyWebsite: "https://artsy.net",
      professionalBuyerAt: "2022-08-15T11:14:55+00:00",
      internalID: "3",
      name: "Percy",
      email: "percy@cat.com",
      selfReportedPurchases: "treats",
      intents: ["buy art & design"],
    }

    expect.assertions(2)

    const { updateCollectorProfileWithID } = await runAuthenticatedQuery(
      mutation,
      context
    )

    expect(updateCollectorProfileWithID).toEqual(expectedProfileData)

    expect(mockUpdateCollectorProfileLoader).toBeCalledWith(
      "5043b8888b3b8145d7005318",
      {
        intents: ["buy art & design"],
        loyalty_applicant: true,
        professional_buyer: true,
        self_reported_purchases: "trust me i buy art",
        institutional_affiliations: "example",
        company_name: "Cool Art Stuff",
        company_website: "https://artsy.net",
      }
    )
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
