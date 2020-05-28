/* eslint-disable promise/always-return */
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("UpdateCollectorProfile", () => {
  it("updates and returns a collector profile", () => {
    /* eslint-disable max-len */
    const mutation = `
      mutation {
        updateCollectorProfile(input: { professionalBuyer: true, loyaltyApplicant: true, selfReportedPurchases: "trust me i buy art", intents: [BUY_ART_AND_DESIGN] }) {
          internalID
          name
          email
          selfReportedPurchases
          intents
        }
      }
    `
    /* eslint-enable max-len */

    const context = {
      updateCollectorProfileLoader: () =>
        Promise.resolve({
          id: "3",
          name: "Percy",
          email: "percy@cat.com",
          self_reported_purchases: "treats",
          intents: ["buy art & design"],
        }),
    }

    const expectedProfileData = {
      internalID: "3",
      name: "Percy",
      email: "percy@cat.com",
      selfReportedPurchases: "treats",
      intents: ["buy art & design"],
    }

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, context).then(
      ({ updateCollectorProfile }) => {
        expect(updateCollectorProfile).toEqual(expectedProfileData)
      }
    )
  })

  it("throws error when data loader is missing", () => {
    /* eslint-disable max-len */
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
    /* eslint-enable max-len */

    const errorResponse =
      "Missing Update Collector Profile Loader. Check your access token."

    expect.assertions(1)
    return runQuery(mutation)
      .then(() => {
        throw new Error("An error was not thrown but was expected.")
      })
      .catch((error) => {
        expect(error.message).toEqual(errorResponse)
      })
  })
})
