jest.mock("lib/apis/fetch", () => jest.fn())
import { HTTPError } from "lib/HTTPError"
import fetch from "lib/apis/fetch"
const mockFetch = fetch as jest.Mock

describe("rate limiting custom status code and response", () => {
  const request = require("supertest")
  const app = require("../../index").default
  const gql = require("lib/gql").default

  beforeEach(() => {
    mockFetch.mockClear()
    mockFetch.mockReset()
  })

  it("propagates a 429 for email provider rate limiting", async () => {
    mockFetch.mockRejectedValueOnce(
      new HTTPError("Braze rate limit reached", 429)
    )

    const response = await request(app)
      .post("/v2")
      .set("Accept", "application/json")
      .set("User-Agent", "Braze")
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
    expect(response.body.error).toBe("rate limit reached, try again later")
  })
})
