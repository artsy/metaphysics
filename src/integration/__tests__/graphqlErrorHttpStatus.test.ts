jest.mock("lib/apis/fetch", () => jest.fn())
import fetch from "lib/apis/fetch"
import config from "config"
const mockFetch = fetch as jest.Mock

// PHIRE-3303: end-to-end coverage through the real Yoga instance, so a
// regression in Yoga's error classification/masking shows up here too.
describe("GraphQL error responses carry the correct HTTP status", () => {
  const request = require("supertest")
  const app = require("../../index").default
  const gql = require("lib/gql").default

  beforeEach(() => {
    mockFetch.mockClear()
    mockFetch.mockReset()
  })

  it("returns 404 for show.ts's HTTPError('Show Not Found', 404)", async () => {
    mockFetch.mockResolvedValueOnce(
      Promise.resolve({
        body: {
          id: "some-show",
          displayable: false,
          is_local_discovery: false,
          is_reference: false,
          fair: null,
        },
      })
    )

    const response = await request(app)
      .post("/v2")
      .set("Accept", "application/json")
      .send({
        query: gql`
          {
            show(id: "some-show") {
              name
            }
          }
        `,
      })

    expect(response.statusCode).toBe(404)
    expect(response.body.errors[0].message).toEqual("Show Not Found")
  })

  it("does not force a 500 for a bad-variables/client-input error", async () => {
    const response = await request(app)
      .post("/v2")
      .set("Accept", "application/json")
      .send({
        query: gql`
          query($id: String!) {
            artist(id: $id) {
              name
            }
          }
        `,
        variables: {},
      })

    expect(mockFetch).not.toHaveBeenCalled()
    expect(response.statusCode).not.toBe(500)
    expect(response.body.errors).not.toBeUndefined()
  })

  it("does not leak internal stack traces to the client in production", async () => {
    config.PRODUCTION_ENV = true
    try {
      mockFetch.mockResolvedValueOnce(
        Promise.resolve({
          body: {
            id: "some-show",
            displayable: false,
            is_local_discovery: false,
            is_reference: false,
            fair: null,
          },
        })
      )

      const response = await request(app)
        .post("/v2")
        .set("Accept", "application/json")
        .send({
          query: gql`
            {
              show(id: "some-show") {
                name
              }
            }
          `,
        })

      expect(response.statusCode).toBe(404)
      expect(response.body.errors[0].extensions?.stack).toBeUndefined()
    } finally {
      config.PRODUCTION_ENV = false
    }
  })
})
