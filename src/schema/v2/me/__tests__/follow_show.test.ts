/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("FollowShow", () => {
  it("follows a show", () => {
    const mutation = `
      mutation {
        followShow(input: { partnerShowID: "pop-art-show" }) {
          show {
            slug
            name
          }
        }
      }
    `
    interface Props {
      followShow: {
        show: {
          slug: String
          name: String
        }
      }
    }

    const context = {
      followShowLoader: () =>
        Promise.resolve({
          partner_show: {
            id: "pop-art-show",
            name: "Pop Art Show",
          },
        }),
      showLoader: () =>
        Promise.resolve({
          id: "pop-art-show",
          name: "Pop Art Show",
        }),
    }

    const expectedShowData = {
      show: {
        slug: "pop-art-show",
        name: "Pop Art Show",
      },
    }

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, context).then((value) => {
      const { followShow } = value as Props
      expect(followShow).toEqual(expectedShowData)
    })
  })

  it("unfollows a show", () => {
    const setup = `
      mutation {
        followShow(input: { partnerShowID: "pop-art-show" }) {
          show {
            slug
            name
          }
        }
      }
    `

    const teardown = `
      mutation {
        followShow(input: { partnerShowID: "pop-art-show", unfollow: true }) {
          show {
            slug
          }
        }
      }
    `

    interface Props {
      followShow: {
        id: String
        name: String
        show: {
          slug: String
        }
      }
    }

    const context = {
      followShowLoader: () =>
        Promise.resolve({
          partner_show: {
            id: "pop-art-show",
            name: "Pop Art Show",
          },
        }),
      unfollowShowLoader: () =>
        Promise.resolve({
          partner_show: {
            id: "pop-art-show",
            name: "Pop Art Show",
            unfollowed: true,
          },
        }),
      showLoader: () =>
        Promise.resolve({
          id: "pop-art-show",
          name: "Pop Art Show",
        }),
    }

    const expectedShowData = {
      show: {
        id: "pop-art-show",
        name: "Pop Art Show",
      },
    }

    expect.assertions(1)
    return runAuthenticatedQuery(setup, context).then(() => {
      return runAuthenticatedQuery(teardown, context).then((value) => {
        const { followShow } = value as Props
        expect(followShow.show.slug).toEqual(expectedShowData.show.id)
      })
    })
  })
})
