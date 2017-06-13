import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("Me", () => {
  describe("CollectorProfile", () => {
    const gravity = sinon.stub()
    const Me = schema.__get__("Me")
    const CollectorProfile = Me.__get__("CollectorProfile")

    beforeEach(() => {
      gravity.with = sinon.stub().returns(gravity)
      CollectorProfile.__Rewire__("gravity", gravity)
    })

    afterEach(() => {
      CollectorProfile.__ResetDependency__("gravity")
    })

    it("returns the collector profile", () => {
      const query = `
        {
          me {
            collector_profile {
              id
              name
              email
              self_reported_purchases
            }
          }
        }
      `

      const collectorProfile = {
        id: "3",
        name: "Percy",
        email: "percy@cat.com",
        self_reported_purchases: "treats",
      }

      const expectedProfileData = {
        id: "3",
        name: "Percy",
        email: "percy@cat.com",
        self_reported_purchases: "treats",
      }

      gravity.returns(Promise.resolve(collectorProfile))

      return runAuthenticatedQuery(query).then(({ me: { collector_profile } }) => {
        expect(collector_profile).toEqual(expectedProfileData)
      })
    })
  })
})
