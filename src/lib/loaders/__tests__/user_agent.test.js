import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { createLoaders } from "../../../lib/loaders"
import gql from "lib/gql"

jest.mock("../../apis/gravity", () => jest.fn())
import gravity from "../../apis/gravity"

describe("User-Agent (with the real data loaders)", () => {
  it("resolves to add the initial user agent to a gravity header", async () => {
    gravity.mockImplementation(() => Promise.resolve({ body: {} }))
    const query = gql`
      {
        artist(id: "andy-warhol") {
          name
        }
      }
    `

    const userAgent = "catty browser"
    const context = createLoaders("access-token", "user-id", {
      userAgent,
    })
    expect.assertions(1)
    await runQuery(query, context)

    expect(gravity).toBeCalledWith("artist/andy-warhol?", null, {
      userAgent,
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
    const userAgent = "catty browser"
    const context = createLoaders("secret", "user-42", { userAgent })
    expect.assertions(1)
    await runAuthenticatedQuery(query, context)

    expect(gravity).toBeCalledWith("me?", "secret", {
      userAgent,
    })
  })
})
