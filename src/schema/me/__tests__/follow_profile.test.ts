/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("FollowProfile", () => {
  let profile: any
  let rootValue: any

  beforeEach(() => {
    profile = { owner: { name: "Casey Kaplan" }, initials: "CK" }
    rootValue = {
      profileLoader: () => Promise.resolve(profile),
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
    return runAuthenticatedQuery(mutation, rootValue).then(data => {
      expect(data!.followProfile).toEqual({
        profile: {
          name: "Casey Kaplan",
        },
      })
    })
  })
})
