import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { createLoaders } from "../../../lib/loaders"
import gql from "lib/gql"
import { resolveIPv4 } from "../../../lib/requestIDs"

jest.mock("../../apis/gravity", () => jest.fn())
import gravity from "../../apis/gravity"

describe("requestID (with the real data loaders)", () => {
  it("resolves to add the initial request ID to a gravity header", async () => {
    gravity.mockImplementation(() => Promise.resolve({ body: {} }))
    const query = gql`
      {
        artist(id: "andy-warhol") {
          name
        }
      }
    `

    const requestIDs = { requestId: "request-id", xForwardedFor: "192.168.0.1" }
    const context = createLoaders("access-token", "user-id", { requestIDs })
    expect.assertions(1)

    await runQuery(query, context)

    expect(gravity).toBeCalledWith("artist/andy-warhol?", null, {
      requestIDs,
    })
  })

  it("(authenticated request) resolves to add the initial request ID to a gravity header", async () => {
    gravity.mockImplementation(() => Promise.resolve({ body: [] }))
    const query = gql`
      {
        me {
          name
        }
      }
    `
    const requestIDs = { requestId: "request-id", xForwardedFor: "192.168.0.1" }
    const context = createLoaders("secret", "user-42", { requestIDs })
    expect.assertions(1)
    await runAuthenticatedQuery(query, context)

    expect(gravity).toBeCalledWith("me?", "secret", {
      requestIDs,
    })
  })
})

describe("resolve ipv4 addresses", () => {
  it("resolves an ipv6 address to ipv4", () => {
    expect(resolveIPv4("::ffff:127.0.0.1")).toEqual("127.0.0.1")
  })
  it("resolves an ipv4 address to an ipv4 address", () => {
    expect(resolveIPv4("127.0.0.1")).toEqual("127.0.0.1")
  })
})
