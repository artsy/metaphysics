import schema from "schema"
import { runQuery } from "test/utils"

describe("Fair type", () => {
  const Fair = schema.__get__("Fair")
  let gravity = null
  let fairData = null

  beforeEach(() => {
    gravity = sinon.stub()

    fairData = {
      id: "the-armory-show-2017",
      name: "The Armory Show 2017",
      organizer: {
        profile_id: "the-armory-show",
      },
    }

    gravity.returns(Promise.resolve(fairData))

    Fair.__Rewire__("gravity", gravity)
  })

  afterEach(() => {
    Fair.__ResetDependency__("gravity")
  })

  const query = `
    {
      fair(id: "the-armory-show-2017") {
        id
        name
        organizer {
          profile_id
          profile {
            is_publically_visible
          }
        }
      }
    }
  `

  it("is_publically_visible returns true when profile is published", () => {
    const profileData = {
      id: "the-armory-show",
      published: true,
      private: false,
    }

    gravity.onCall(1).returns(Promise.resolve(profileData))

    return runQuery(query).then(data => {
      expect(data).toEqual({
        fair: {
          id: "the-armory-show-2017",
          name: "The Armory Show 2017",
          organizer: {
            profile_id: "the-armory-show",
            profile: {
              is_publically_visible: true,
            },
          },
        },
      })
    })
  })

  it("is_publically_visible returns false when profile is not published", () => {
    const unpublishedProfileData = {
      id: "context",
      published: false,
      private: false,
    }

    gravity.onCall(1).returns(Promise.resolve(unpublishedProfileData))

    return runQuery(query).then(data => {
      expect(data).toEqual({
        fair: {
          id: "the-armory-show-2017",
          name: "The Armory Show 2017",
          organizer: {
            profile_id: "the-armory-show",
            profile: {
              is_publically_visible: false,
            },
          },
        },
      })
    })
  })

  it("is_publically_visible returns false when profile is not published", () => {
    const privateProfileData = {
      id: "context",
      published: false,
      private: false,
    }

    gravity.onCall(1).returns(Promise.resolve(privateProfileData))

    return runQuery(query).then(data => {
      expect(data).toEqual({
        fair: {
          id: "the-armory-show-2017",
          name: "The Armory Show 2017",
          organizer: {
            profile_id: "the-armory-show",
            profile: {
              is_publically_visible: false,
            },
          },
        },
      })
    })
  })
})
