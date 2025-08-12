jest.mock("request", () => jest.fn())
import request from "request"
const mockRequest = (request as any) as jest.Mock

import fetch from "../../apis/fetch"
import { constructUrlAndParams } from "../../apis/fetch"
import { toQueryString } from "../../helpers"
import { parse } from "qs"

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

  return expectPromiseRejectionToMatch(fetch("foo/bar"), /(Expected property)/)
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

  it("correctly handles simple arrays with bracket notation", () => {
    const { body } = constructUrlAndParams(
      "POST",
      "https://staging.artsy.net/api/v1/artworks/collections/batch?artwork_ids[]=id1&artwork_ids[]=id2&add_to[]=coll1"
    )

    expect(body).toEqual({
      artwork_ids: ["id1", "id2"],
      add_to: ["coll1"],
    })
  })

  it("correctly handles mixed data types", () => {
    const { body } = constructUrlAndParams(
      "PUT",
      "https://staging.artsy.net/api/v1/artist/banksy?name=Banksy&tags[]=street&tags[]=graffiti&public=true"
    )

    expect(body).toEqual({
      name: "Banksy",
      tags: ["street", "graffiti"],
      public: "true",
    })
  })

  it("correctly handles nested arrays with objects using indexed notation", () => {
    const { body } = constructUrlAndParams(
      "PUT",
      "https://staging.artsy.net/api/v1/artwork_import/123/image_matches?images[0][id]=img1&images[0][position]=0&images[1][id]=img2&images[1][position]=1"
    )

    expect(body).toEqual({
      images: [
        { id: "img1", position: "0" },
        { id: "img2", position: "1" },
      ],
    })
  })

  it("handles double bracket notation", () => {
    const { body } = constructUrlAndParams(
      "PUT",
      "artwork_import/123/image_matches?images[][id]=img1&images[][position]=0&images[][id]=img2&images[][position]=1"
    )

    // Current behavior - creates arrays within single object
    expect(body).toEqual({
      images: [
        {
          id: ["img1", "img2"],
          position: ["0", "1"],
        },
      ],
    })
  })

  it("should handle indexed notation correctly", () => {
    const { body } = constructUrlAndParams(
      "PUT",
      "artwork_import/123/image_matches?images[0][id]=img1&images[0][position]=0&images[1][id]=img2&images[1][position]=1"
    )

    expect(body).toEqual({
      images: [
        { id: "img1", position: "0" },
        { id: "img2", position: "1" },
      ],
    })
  })

  it("test backwards compatibility with toQueryString helper", () => {
    // Test simple arrays
    const simpleArray = { tags: ["tag1", "tag2"] }
    const simpleQuery = toQueryString(simpleArray)
    const simpleParsed = parse(simpleQuery, { arrayLimit: 1000 })

    expect(simpleParsed).toEqual({ tags: ["tag1", "tag2"] })

    // Test complex nested objects
    const complexArray = {
      images: [
        { id: "img1", position: 0 },
        { id: "img2", position: 1 },
      ],
    }
    const complexQuery = toQueryString(complexArray)
    const complexParsed = parse(complexQuery, { arrayLimit: 1000 })

    expect(complexParsed).toEqual({
      images: [
        { id: "img1", position: "0" },
        { id: "img2", position: "1" },
      ],
    })

    // Test that the generated query uses indices format
    expect(complexQuery).toContain("images%5B0%5D")
    expect(complexQuery).toContain("images%5B1%5D")
  })

  it("handles deeply nested complex structures", () => {
    const deeplyNested = {
      images: [
        { id: "img1", position: { foo: [1, 2, 3] } },
        { id: "img2", position: { bar: [1, { a: "hi" }] } },
      ],
    }

    const query = toQueryString(deeplyNested)
    const parsed = parse(query, { arrayLimit: 1000 })

    expect(parsed).toEqual({
      images: [
        { id: "img1", position: { foo: ["1", "2", "3"] } },
        { id: "img2", position: { bar: ["1", { a: "hi" }] } },
      ],
    })
  })
})
