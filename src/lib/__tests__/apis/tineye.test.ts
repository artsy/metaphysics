import config from "config"
import FormData from "form-data"
import tineye, { tineyeSearch } from "lib/apis/tineye"
import fetch from "node-fetch"
import { Readable } from "stream"

jest.mock("node-fetch")

describe("TinEye", () => {
  config.TINEYE_API_USERNAME = "username"
  config.TINEYE_API_PASSWORD = "password"
  config.SYSTEM_ENVIRONMENT = "ENV123"

  const mockFetch = (fetch as unknown) as jest.Mock<typeof fetch>

  describe("tineye", () => {
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

  describe("tineyeSearch", () => {
    let file

    beforeEach(() => {
      mockFetch.mockClear()

      file = Readable.from(Buffer.from("helloWorld"))
    })

    it("makes a request with correct url and environment path filter", async () => {
      const url =
        "https://username:password@mobileengine.tineye.com/artsy/rest/search"

      const options = {
        image: file,
        filename: "filename",
        contentType: "contentType",
      }

      await tineyeSearch(options)

      expect(fetch).toHaveBeenCalledWith(url, {
        body: expect.objectContaining({
          _streams: expect.arrayContaining(["^env123/"]),
        }),
        method: "POST",
      })
    })
  })
})
