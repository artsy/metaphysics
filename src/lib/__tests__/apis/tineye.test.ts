import tineye from "lib/apis/tineye"
import config from "config"
import fetch from "lib/apis/fetch"

jest.mock("lib/apis/fetch", () => jest.fn())

describe("TinEye", () => {
  config.TINEYE_API_USERNAME = "username"
  config.TINEYE_API_PASSWORD = "password"

  it("makes a request with correct url and options", async () => {
    const url =
      "https://username:password@mobileengine.tineye.com/artsy/rest/search"
    const options = {
      method: "POST",
      formData: {
        my_field: "my_value",
      },
    }

    await tineye("/search", options)

    expect(fetch).toBeCalledWith(url, options)
  })

  it("resolves when there is a successful response", async () => {
    ;(fetch as jest.Mock).mockResolvedValue({ foo: "bar" })
    const response = await tineye("search", { method: "POST" })

    expect(response.foo).toBe("bar")
  })
})
