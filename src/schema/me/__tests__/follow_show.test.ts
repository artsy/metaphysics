/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("FollowShow", () => {
  it("follows a show", () => {
    const mutation = `
      mutation {
        followShow(input: { partner_show_id: "pop-art-show" }) {
          show {
            id
            name
          }
        }
      }
    `

    const rootValue = {
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
        id: "pop-art-show",
        name: "Pop Art Show",
      },
    }

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, rootValue).then(({ followShow }) => {
      expect(followShow).toEqual(expectedShowData)
    })
  })
})
