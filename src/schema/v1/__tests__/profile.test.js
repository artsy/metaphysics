/* eslint-disable promise/always-return */
import { runQuery } from "schema/v1/test/utils"

describe("Profile type", () => {
  let profileData = null
  let context = null

  beforeEach(() => {
    profileData = {
      id: "the-armory-show",
      published: true,
      private: false,
    }

    context = {
      profileLoader: sinon.stub().returns(Promise.resolve(profileData)),
    }
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
    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        profile: {
          id: "the-armory-show",
          is_publically_visible: true,
        },
      })
    })
  })

  it("is_publically_visible returns false when profile is private", () => {
    profileData.private = true
    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        profile: {
          id: "the-armory-show",
          is_publically_visible: false,
        },
      })
    })
  })
})
