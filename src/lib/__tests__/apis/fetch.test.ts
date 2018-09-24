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

  return expectPromiseRejectionToMatch(fetch("foo/bar"), /Unexpected token/)
})

it("tries to parse the response when there is a String and resolves with it", done => {
  let reqResponse = {
    statusCode: 400,
    request: {
      uri: {
        href: "http://api.artsy.net/api/v1/me",
      },
    },
    body: `{ "type": "other_error", "message": "undefined method \`[]' for nil:NilClass" }`,
  }

  mockRequest.mockImplementationOnce((_, __, callback) =>
    callback(null, reqResponse)
  )

  fetch("foo/bar").catch(error => {
    expect(error.message).toEqual(
      `http://api.artsy.net/api/v1/me - { "type": "other_error", "message": "undefined method \`[]' for nil:NilClass" }`
    )
    expect(error.statusCode).toEqual(400)
    expect(error.body).toEqual(
      `{ "type": "other_error", "message": "undefined method \`[]' for nil:NilClass" }`
    )
    done()
  })
})
