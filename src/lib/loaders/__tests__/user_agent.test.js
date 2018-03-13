import { runAuthenticatedQuery, runQuery } from "test/utils"
import createLoaders from "../../../lib/loaders"
import gql from "test/gql"

import factories from "../../../lib/loaders/api"

describe("User-Agent (with the real data loaders)", () => {
  it("resolves to add the initial user agent to a gravity header", () => {
    const query = gql`
      {
        artist(id: "andy-warhol") {
          name
        }
      }
    `
    const gravity = jest.fn(() => Promise.resolve({}))
    factories.__Rewire__("gravity", gravity)
    const userAgent = "catty browser"
    const rootValue = createLoaders("access-token", "user-id", {
      userAgent,
    })
    expect.assertions(1)
    return runQuery(query, rootValue).then(() => {
      expect(gravity).toBeCalledWith("artist/andy-warhol?", null, {
        userAgent,
      })
    })
  })

  it("(authenticated request) resolves to add the initial request ID to a gravity header", () => {
    const query = gql`
      {
        me {
          lot_standings {
            is_highest_bidder
          }
        }
      }
    `
    const gravity = jest.fn(() => Promise.resolve({}))
    factories.__Rewire__("gravity", gravity)
    const userAgent = "catty browser"
    const rootValue = createLoaders("secret", "user-42", { userAgent })
    expect.assertions(1)
    return runAuthenticatedQuery(query, rootValue).then(() => {
      expect(gravity).toBeCalledWith("me/lot_standings?", "secret", {
        userAgent,
      })
    })
  })
})
