// const mockRequest = jest.fn(() => ({}))

jest.mock("request", () => jest.fn())
jest.mock("config", () => ({ REQUEST_TIMEOUT_MS: "123" }))

import request from "request"
import fetch from "lib/apis/fetch"

describe("fetching data", () => {
  it("resolves when there is a successful JSON response", () => {
    const response = { statusCode: 200, body: JSON.stringify({ foo: "bar" }) }
    request.mockImplementationOnce((url, opts, callback) => callback(null, response))

    return fetch("foo/bar").then(({ body: { foo } }) => {
      expect(foo).toBe("bar")
    })
  })

  it("rejects request errors", () => {
    request.mockImplementationOnce(() => {
      throw new Error("bad")
    })

    return expectPromiseRejectionToMatch(fetch("foo/bar"), /bad/)
  })

  it("rejects API errors", () => {
    const response = { statusCode: 401, body: "Unauthorized" }
    request.mockImplementationOnce((url, opts, callback) => callback(null, response))

    return expectPromiseRejectionToMatch(fetch("foo/bar"), /Unauthorized/)
  })

  it("rejects parse errors", () => {
    const response = { statusCode: 200, body: "not JSON" }
    request.mockImplementationOnce((url, opts, callback) => callback(null, response))

    return expectPromiseRejectionToMatch(fetch("foo/bar"), /Unexpected token/)
  })
})
