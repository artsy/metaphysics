/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("UpdateCollectorProfile", () => {
  it("updates and returns a collector profile", () => {
    /* eslint-disable max-len */
    const mutation = `
      mutation {
        updateCollectorProfile(input: { professional_buyer: true, loyalty_applicant: true, self_reported_purchases: "trust me i buy art", intents: [BUY_ART_AND_DESIGN] }) {
          id
          name
          email
          self_reported_purchases
          intents
        }
      }
    `
    /* eslint-enable max-len */

    const rootValue = {
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
      id: "3",
      name: "Percy",
      email: "percy@cat.com",
      self_reported_purchases: "treats",
      intents: ["buy art & design"],
    }

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, rootValue).then(
      ({ updateCollectorProfile }) => {
        expect(updateCollectorProfile).toEqual(expectedProfileData)
      }
    )
  })

  it("throws error when data loader is missing", () => {
    /* eslint-disable max-len */
    const mutation = `
      mutation {
        updateCollectorProfile(input: { professional_buyer: true, loyalty_applicant: true, self_reported_purchases: "trust me i buy art" }) {
          id
          name
          email
          self_reported_purchases
          intents
        }
      }
    `
    /* eslint-enable max-len */

    const rootValue = {}

    const errorResponse =
      "Missing Update Collector Profile Loader. Check your access token."

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, rootValue)
      .then(() => {
        throw new Error("An error was not thrown but was expected.")
      })
      .catch(error => {
        expect(error.message).toEqual(errorResponse)
      })
  })
})
