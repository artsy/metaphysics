/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("FollowProfile", () => {
  let profile = null
  let rootValue = null

  beforeEach(() => {
    profile = { owner: { name: "Casey Kaplan" }, initials: "CK" }

    rootValue = {
      profileLoader: sinon.stub().returns(Promise.resolve(profile)),
      followProfileLoader: () => Promise.resolve(profile),
      unfollowProfileLoader: () => Promise.resolve(profile),
    }
  })

  it("follows a profile", () => {
    const mutation = `
      mutation {
        followProfile(input: { profile_id: "casey-kaplan" }) {
          profile {
            name
          }
        }
      }
    `

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, rootValue).then(
      ({ followProfile }) => {
        expect(followProfile).toEqual({
          profile: {
            name: "Casey Kaplan",
          },
        })
      }
    )
  })
})
