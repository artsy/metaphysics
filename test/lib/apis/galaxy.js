import fetch from "lib/apis/fetch"
jest.mock("lib/apis/fetch")

import galaxy from "lib/apis/galaxy"

describe("APIs", () => {
  describe("galaxy", () => {
    it("makes a correct request to galaxy", () => {
      fetch.mockImplementationOnce(() => Promise.resolve({ statusCode: 200, body: {} }))

      return galaxy("foo/bar").then(() => {
        const url = "https://galaxy-staging-herokuapp.com/foo/bar"
        const fetchOptions = {
          headers: {
            Accept: "application/vnd.galaxy-public+json",
            "Content-Type": "application/hal+json",
            "Http-Authorization": "galaxy_token",
          },
        }

        expect(fetch).toBeCalledWith(url, fetchOptions)
      })
    })

    it("resolves when there is a successful JSON response", () => {
      fetch.mockImplementationOnce(() => Promise.resolve({ statusCode: 200, body: { foo: "bar" } }))

      return galaxy("foo/bar").then(({ body: { foo } }) => {
        expect(foo).toBe("bar")
      })
    })
  })
})
