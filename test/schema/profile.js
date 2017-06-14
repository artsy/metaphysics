import schema from "schema"
import { runQuery } from "test/utils"

describe("Profile type", () => {
  const Profile = schema.__get__("Profile")
  let gravity = null
  let profileData = null

  beforeEach(() => {
    gravity = sinon.stub()

    profileData = {
      id: "the-armory-show",
      published: true,
      private: false,
    }

    gravity.returns(Promise.resolve(profileData))

    Profile.__Rewire__("gravity", gravity)
  })

  afterEach(() => {
    Profile.__ResetDependency__("gravity")
  })

  const query = `
    {
      profile(id: "the-armory-show") {
        id
        is_publically_visible
      }
    }
  `

  it("is_publically_visible returns true when profile is published", () => {
    return runQuery(query).then(data => {
      expect(data).toEqual({
        profile: {
          id: "the-armory-show",
          is_publically_visible: true,
        },
      })
    })
  })
})

describe("Profile type", () => {
  const Profile = schema.__get__("Profile")
  let gravity = null
  let profileData = null

  beforeEach(() => {
    gravity = sinon.stub()

    profileData = {
      id: "the-armory-show",
      published: true,
      private: true,
    }

    gravity.returns(Promise.resolve(profileData))

    Profile.__Rewire__("gravity", gravity)
  })

  afterEach(() => {
    Profile.__ResetDependency__("gravity")
  })

  const query = `
    {
      profile(id: "the-armory-show") {
        id
        is_publically_visible
      }
    }
  `

  it("is_publically_visible returns false when profile is private", () => {
    return runQuery(query).then(data => {
      expect(data).toEqual({
        profile: {
          id: "the-armory-show",
          is_publically_visible: false,
        },
      })
    })
  })
})
