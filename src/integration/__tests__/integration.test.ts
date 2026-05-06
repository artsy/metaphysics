jest.mock("lib/apis/fetch", () => jest.fn())
import fetch from "lib/apis/fetch"
const mockFetch = fetch as jest.Mock

describe("integration tests", () => {
  // These tests ensure that *any* query works against our express app.
  const request = require("supertest")
  const app = require("../../index").default
  const gql = require("lib/gql").default

  beforeEach(() => {
    mockFetch.mockClear()
    mockFetch.mockReset()
  })

  it("should bail for an unknown GET request", async () => {
    const response = await request(app).get("/v2")
    expect(response.statusCode).toBe(400)
  })

  it("can make a request against the schema", async () => {
    // Mock the fetch for the Artist loader
    mockFetch.mockResolvedValueOnce(
      Promise.resolve({ body: { name: "Mr Bank" } })
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

    expect(response.body.data).toEqual({ artist: { name: "Mr Bank" } })
    expect(response.statusCode).toBe(200)
  })

  it("assigns x-xapp-token if present", async () => {
    mockFetch.mockResolvedValueOnce(Promise.resolve({ body: {} }))

    await request(app)
      .post("/v2")
      .set("Accept", "application/json")
      .set("x-xapp-token", "xapp-token")
      .send({
        query: gql`
          {
            artist(id: "yayoi-kusama") {
              name
            }
          }
        `,
      })

    expect(mockFetch.mock.calls[0][1].headers["X-XAPP-TOKEN"]).toEqual(
      "xapp-token"
    )
  })

  it("doesn't include `extensions` by default", async () => {
    // Mock the fetch for the Artist loader
    mockFetch.mockResolvedValueOnce(
      Promise.resolve({ body: { name: "Mr Bank" } })
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

    expect(response.body.data).toEqual({ artist: { name: "Mr Bank" } })
    expect(response.statusCode).toBe(200)
    expect(response.body.extensions).toBeFalsy()
  })
})
