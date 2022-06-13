jest.mock("request", () => jest.fn())
import request, { Request } from "request"
const mockRequest = (request as any) as jest.Mock<Request>

import fetch from "../../apis/fetch"
import { constructUrlAndParams } from "../../apis/fetch"

declare const expectPromiseRejectionToMatch: any

it("tries to parse the response when there is a String and resolves with it", async () => {
  const reqResponse = {
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

it("tries to parse the response when there is a String and resolves with it (2)", async () => {
  const reqResponse = {
    statusCode: 200,
    body: `{ not json }`,
  }

  mockRequest.mockImplementationOnce((_, __, callback) => {
    callback(null, reqResponse)
  })

  return expectPromiseRejectionToMatch(fetch("foo/bar"), /Unexpected token/)
})

it("tries to parse the response when there is a String and resolves with it (3)", () => {
  const reqResponse = {
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

  expect.assertions(3)

  return fetch("foo/bar").catch((error) => {
    expect(error.message).toEqual(
      `http://api.artsy.net/api/v1/me - { "type": "other_error", "message": "undefined method \`[]' for nil:NilClass" }`
    )
    expect(error.statusCode).toEqual(400)
    expect(error.body).toEqual(
      `{ "type": "other_error", "message": "undefined method \`[]' for nil:NilClass" }`
    )
  })
})

describe("constructUrlAndParams", () => {
  it("passes thru the url for a GET without query params", () => {
    const { url, body, json } = constructUrlAndParams(
      "GET",
      "https://staging.artsy.net/api/v1/artist/andy-warhol"
    )
    expect(url).toEqual("https://staging.artsy.net/api/v1/artist/andy-warhol")
    expect(body).toBeUndefined()
    expect(json).toBeUndefined()
  })

  it("passes thru the url for a GET with query params", () => {
    const { url, body, json } = constructUrlAndParams(
      "GET",
      "https://staging.artsy.net/api/v1/filter/artworks?acquireable=true"
    )
    expect(url).toEqual(
      "https://staging.artsy.net/api/v1/filter/artworks?acquireable=true"
    )
    expect(body).toBeUndefined()
    expect(json).toBeUndefined()
  })

  const methods = ["PUT", "POST", "DELETE"]

  methods.forEach((method) => {
    describe(`for a ${method} request`, () => {
      it("removes query params", () => {
        const { url, body, json } = constructUrlAndParams(
          method,
          "https://staging.artsy.net/api/v1/me/token?client_application_id=blah"
        )
        expect(url).toEqual("https://staging.artsy.net/api/v1/me/token")
        expect(body).toEqual({ client_application_id: "blah" })
        expect(json).toBeTruthy()
      })

      it("works for arrays", () => {
        const { url, body, json } = constructUrlAndParams(
          method,
          "https://staging.artsy.net/api/v1/me/token?client_application_id[]=blah&client_application_id[]=cool"
        )
        expect(url).toEqual("https://staging.artsy.net/api/v1/me/token")
        expect(body).toEqual({
          client_application_id: ["blah", "cool"],
        })
        expect(json).toBeTruthy()
      })
    })
  })

  it("correctly stringifies object-formatted array data", () => {
    const { body } = constructUrlAndParams(
      "PUT",
      "https://staging.artsy.net/api/v1/filter/artworks?0=foo&1=bar"
    )

    expect(body).toEqual(["foo", "bar"])
  })
})
