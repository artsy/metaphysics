import fetch from "lib/apis/fetch"
jest.mock("lib/apis/fetch")
jest.mock("config", () => ({ GRAVITY_XAPP_TOKEN: "123" }))

import gravity from "lib/apis/gravity"

describe("APIs", () => {
  describe("galaxy", () => {
    it("makes a correct request to gravity", () => {
      fetch.mockImplementationOnce(() => Promise.resolve({ statusCode: 200, body: {} }))

      return gravity("foo/bar").then(() => {
        const url = "https://api.artsy.test/api/v1/foo/bar"
        const fetchOptions = {
          headers: {
            "X-XAPP-TOKEN": "123",
          },
        }

        expect(fetch).toBeCalledWith(url, fetchOptions)
      })
    })

    it("resolves when there is a successful JSON response", () => {
      fetch.mockImplementationOnce(() => Promise.resolve({ statusCode: 200, body: { foo: "bar" } }))

      return gravity("foo/bar").then(({ body: { foo } }) => {
        expect(foo).toBe("bar")
      })
    })
  })
})
