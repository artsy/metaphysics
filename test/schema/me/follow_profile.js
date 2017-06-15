import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("FollowProfile", () => {
  const gravity = sinon.stub()
  const FollowProfile = schema.__get__("FollowProfile")

  beforeEach(() => {
    gravity.with = sinon.stub().returns(gravity)

    FollowProfile.__Rewire__("gravity", gravity)
  })

  afterEach(() => {
    FollowProfile.__ResetDependency__("gravity")
  })

  it("follows an profile", () => {
    const mutation = `
      mutation {
        followProfile(input: { profile_id: "gagosian" }) {
          profile {
            name
          }
        }
      }
    `

    const profile = {
      id: "gagosian",
      name: "Gagosian Gallery",
    }

    const expectedProfileData = {
      profile: {
        name: "Gagosian Gallery",
      },
    }

    const rootValue = {
      profileLoader: sinon.stub().withArgs(profile.id).returns(Promise.resolve(profile)),
    }

    gravity.returns(Promise.resolve(profile))

    return runAuthenticatedQuery(mutation, rootValue).then(({ followProfile }) => {
      expect(followProfile).toEqual(expectedProfileData)
    })
  })
})
