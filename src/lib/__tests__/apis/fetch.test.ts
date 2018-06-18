jest.mock("request", () => jest.fn())
import request, { Request } from "request"
const mockRequest = (request as any) as jest.Mock<Request>

import fetch from "../../apis/fetch"

declare const expectPromiseRejectionToMatch: any

it("tries to parse the response when there is a String and resolves with it", async () => {
  let reqResponse = {
    statusCode: 200,
    body: `{ "foo": "bar" }`,
  }

  mockRequest.mockImplementationOnce((_, __, callback) => {
    callback(null, reqResponse)
  })

  const response = await fetch("foo/bar")

  expect(response.body.foo).toBe("bar")
})

it("rejects request errors", async () => {
  mockRequest.mockImplementationOnce((_, __, ___) => {
    throw new Error("bad")
  })

  expectPromiseRejectionToMatch(fetch("foo/bar"), /bad/)
})

it("tries to parse the response when there is a String and resolves with it", async () => {
  let reqResponse = {
    statusCode: 200,
    body: `{ not json }`,
  }

  mockRequest.mockImplementationOnce((_, __, callback) => {
    callback(null, reqResponse)
  })

  return expectPromiseRejectionToMatch(fetch("foo/bar"), /Bad object/)
})
