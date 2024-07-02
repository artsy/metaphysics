jest.mock("lib/apis/fetch", () => jest.fn())
import { HTTPError } from "lib/HTTPError"
import fetch from "lib/apis/fetch"
const mockFetch = fetch as jest.Mock

describe("rate limiting patch", () => {
  const request = require("supertest")
  const app = require("../../index").default
  const gql = require("lib/gql").default

  beforeEach(() => {
    mockFetch.mockClear()
    mockFetch.mockReset()
  })

  it("propagates a 429 for Braze rate limiting", async () => {
    mockFetch.mockRejectedValueOnce(
      new HTTPError("Braze rate limit reached", 429)
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

    expect(response.statusCode).toBe(429)
  })
})
