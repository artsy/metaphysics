import { runAuthenticatedQuery, runQuery } from "test/utils"
import createLoaders from "../../../lib/loaders"
import gql from "test/gql"

import factories from "../../../lib/loaders/api"

describe("requestID (with the real data loaders)", () => {
  it("resolves to add the initial request ID to a gravity header", () => {
    const query = gql`
      {
        artist(id: "andy-warhol") {
          name
        }
      }
    `
    const gravity = jest.fn(() => Promise.resolve({}))
    factories.__Rewire__("gravity", gravity)
    const requestIDs = { requestId: "request-id" }
    const rootValue = createLoaders("access-token", "user-id", requestIDs)
    expect.assertions(1)
    return runQuery(query, rootValue).then(() => {
      expect(gravity).toBeCalledWith("artist/andy-warhol?", null, {
        requestIDs,
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
    const requestIDs = { requestId: "request-id" }
    const rootValue = createLoaders("secret", "user-42", requestIDs)
    expect.assertions(1)
    return runAuthenticatedQuery(query, rootValue).then(() => {
      expect(gravity).toBeCalledWith("me/lot_standings?", "secret", {
        requestIDs,
      })
    })
  })
})
