/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

xdescribe("Profile type", () => {
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
        slug
        isPubliclyVisible
      }
    }
  `

  it("isPubliclyVisible returns true when profile is published", () => {
    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        profile: {
          slug: "the-armory-show",
          isPubliclyVisible: true,
        },
      })
    })
  })

  it("isPubliclyVisible returns false when profile is private", () => {
    profileData.private = true
    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        profile: {
          slug: "the-armory-show",
          isPubliclyVisible: false,
        },
      })
    })
  })
})
