import tineye from "lib/apis/tineye"
import config from "config"
import FormData from "form-data"
import fetch from "node-fetch"

jest.mock("node-fetch")

describe("TinEye", () => {
  config.TINEYE_API_USERNAME = "username"
  config.TINEYE_API_PASSWORD = "password"
  const mockFetch = (fetch as unknown) as jest.Mock<typeof fetch>

  beforeEach(() => {
    mockFetch.mockClear()
  })

  it("makes a request with correct url and options", async () => {
    const url =
      "https://username:password@mobileengine.tineye.com/artsy/rest/search"
    const formData = new FormData()

    formData.append("my_field", "my_value")

    const options = {
      method: "POST",
      body: formData,
    }

    await tineye("/search", options)

    expect(fetch).toBeCalledWith(url, options)
  })

  it("resolves when there is a successful response", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => ({
        foo: "bar",
      }),
    })
    const response = await tineye("search", { method: "POST" })
    const json = await response.json()

    expect(json.foo).toBe("bar")
  })
})
