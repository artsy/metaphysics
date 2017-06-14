import followedProfile from "../../../lib/loaders/followed_profile"

describe("followedProfile", () => {
  afterEach(() => followedProfile.__ResetDependency__("gravity"))

  it("loads the path and passes in the token", () => {
    const accessToken = "hello"
    const id = "cab"

    const gravity = sinon.stub().returns(
      Promise.resolve({
        body: [{ profile: { id: "cab", name: "Cab" } }],
      })
    )

    followedProfile.__Rewire__("gravity", gravity)

    return followedProfile.load(JSON.stringify({ id, accessToken })).then(profile => {
      expect(gravity.args[0][0]).toBe("me/follow/profiles?profiles%5B%5D=cab")
      expect(gravity.args[0][1]).toBe("hello")
      expect(profile.is_followed).toBe(true)
    })
  })

  it("marks is_followed as false if profile is not returned", () => {
    const accessToken = "hello"
    const id = "cab"

    const gravity = sinon.stub().returns(
      Promise.resolve({
        body: [],
      })
    )

    followedProfile.__Rewire__("gravity", gravity)

    return followedProfile.load(JSON.stringify({ id, accessToken })).then(profile => {
      expect(gravity.args[0][0]).toBe("me/follow/profiles?profiles%5B%5D=cab")
      expect(gravity.args[0][1]).toBe("hello")
      expect(profile.is_followed).toBe(false)
    })
  })
})
