/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("Me", () => {
  describe("CollectorProfile", () => {
    it("returns the collector profile", () => {
      const query = `
        {
          me {
            collector_profile {
              id
              name
              email
              self_reported_purchases
              intents
            }
          }
        }
      `

      const collectorProfile = {
        id: "3",
        name: "Percy",
        email: "percy@cat.com",
        self_reported_purchases: "treats",
        intents: ["buy art & design"],
      }

      const expectedProfileData = {
        id: "3",
        name: "Percy",
        email: "percy@cat.com",
        self_reported_purchases: "treats",
        intents: ["buy art & design"],
      }

      const rootValue = {
        collectorProfileLoader: sinon
          .stub()
          .returns(Promise.resolve(collectorProfile)),
      }

      return runAuthenticatedQuery(query, rootValue).then(
        ({ me: { collector_profile } }) => {
          expect(collector_profile).toEqual(expectedProfileData)
        }
      )
    })
  })
})
