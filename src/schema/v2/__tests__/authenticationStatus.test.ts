/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

describe("authenticationStatus", () => {
  const query = `{ authenticationStatus }`

  it("requests successful authentication status", async () => {
    const context = {
      mePingLoader: () => Promise.resolve({}),
    }

    const data = await runQuery(query, context)
    expect(data!.authenticationStatus).toBe("LOGGED_IN")
  })

  it("requests invalid authentication status", async () => {
    const context = {
      mePingLoader: () =>
        Promise.reject(new HTTPError(`Unauthorized`, 401, "Gravity Error")),
    }
    const data = await runQuery(query, context)
    expect(data!.authenticationStatus).toBe("INVALID")
  })

  it("requests logged-out authentication status", async () => {
    const context = {}
    const data = await runQuery(query, context)
    expect(data!.authenticationStatus).toBe("LOGGED_OUT")
  })
})
