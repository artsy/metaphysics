jest.mock("lib/apis/fetch", () => jest.fn())
import { HTTPError } from "lib/HTTPError"
import fetch from "lib/apis/fetch"
const mockFetch = fetch as jest.Mock

describe("setting custom headers", () => {
  const request = require("supertest")
  const app = require("../../index").default
  const gql = require("lib/gql").default

  beforeEach(() => {
    mockFetch.mockClear()
    mockFetch.mockReset()
  })

  describe("when there is an upstream eror", () => {
    it("sets `Cache-Control: no-cache`", async () => {
      mockFetch.mockRejectedValueOnce(
        new HTTPError("Upstream hiccup, cats in the server room", 500)
      )

      const response = await request(app)
        .post("/v2")
        .set("Accept", "application/json")
        .send({
          query: gql`
            {
              artist(id: "banksy") {
                name
              }
            }
          `,
        })

      expect(response.statusCode).toBe(200)
      expect(response.body.errors).not.toBeUndefined()
      expect(response.headers["cache-control"]).toBe("no-cache")
    })
  })

  describe("when there's no upstream error", () => {
    it("does not set `Cache-Control: no-cache`", async () => {
      mockFetch.mockResolvedValueOnce(
        Promise.resolve({ body: { name: "Banksy" } })
      )

      const response = await request(app)
        .post("/v2")
        .set("Accept", "application/json")
        .send({
          query: gql`
            {
              artist(id: "banksy") {
                name
              }
            }
          `,
        })

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual({ data: { artist: { name: "Banksy" } } })
      expect(response.body.errors).toBeUndefined()
      expect(response.headers["cache-control"]).toBeUndefined()
    })
  })
})
