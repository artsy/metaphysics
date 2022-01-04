/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Me", () => {
  describe("CollectorProfile", () => {
    it("returns the collector profile", () => {
      const query = `
        {
          me {
            collectorProfile {
              internalID
              name
              email
              selfReportedPurchases
              intents
              privacy
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
        privacy: 1,
      }

      const expectedProfileData = {
        internalID: "3",
        name: "Percy",
        email: "percy@cat.com",
        selfReportedPurchases: "treats",
        intents: ["buy art & design"],
        privacy: 1,
      }

      const context = {
        collectorProfileLoader: sinon
          .stub()
          .returns(Promise.resolve(collectorProfile)),
      }

      return runAuthenticatedQuery(query, context).then(
        ({ me: { collectorProfile } }) => {
          expect(collectorProfile).toEqual(expectedProfileData)
        }
      )
    })
  })
})
