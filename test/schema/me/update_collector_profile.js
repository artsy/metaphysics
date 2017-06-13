import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("UpdateCollectorProfile", () => {
  const gravity = sinon.stub()
  const UpdateCollectorProfile = schema.__get__("UpdateCollectorProfile")

  beforeEach(() => {
    gravity.with = sinon.stub().returns(gravity)

    UpdateCollectorProfile.__Rewire__("gravity", gravity)
  })

  afterEach(() => {
    UpdateCollectorProfile.__ResetDependency__("gravity")
  })

  it("updates and returns a collector profile", () => {
    /* eslint-disable max-len */
    const mutation = `
      mutation {
        updateCollectorProfile(input: { professional_buyer: true, loyalty_applicant: true, self_reported_purchases: "trust me i buy art" }) {
          id
          name
          email
          self_reported_purchases
        }
      }
    `
    /* eslint-enable max-len */

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

    gravity.onCall(0).returns(Promise.resolve(collectorProfile))

    return runAuthenticatedQuery(mutation).then(({ updateCollectorProfile }) => {
      expect(updateCollectorProfile).toEqual(expectedProfileData)
    })
  })
})
