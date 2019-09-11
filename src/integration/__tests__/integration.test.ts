jest.mock("lib/apis/fetch", () => jest.fn())
import fetch from "lib/apis/fetch"
const mockFetch = fetch as jest.Mock

// These tests ensure that *any* query works against our express app.
const request = require("supertest")
const app = require("../../index").default
const gql = require("lib/gql").default

beforeEach(() => {
  mockFetch.mockClear()
})

it("It should bail for an unknown GET request", async () => {
  const response = await request(app).get("/")
  expect(response.statusCode).toBe(400)
})

it("can make a request against the schema", async () => {
  // Mock the fetch for the Artist loader
  mockFetch.mockResolvedValueOnce(
    Promise.resolve({ body: { name: "Mr Bank" } })
  )

  const response = await request(app)
    .post("/")
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

describe("variable parsing and coercion", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValueOnce(
      Promise.resolve({ body: [{ id: "catty-sale" }] })
    )
  })

  it("converts the string 'true' to a boolean", async () => {
    const response = await request(app)
      .post("/")
      .set("Accept", "application/json")
      .send({
        query: gql`
          query SalesQuery($is_auction: Boolean!) {
            sales(is_auction: $is_auction) {
              id
            }
          }
        `,
        variables: {
          is_auction: "true",
        },
      })

    // We are checking that this works w/ string variables
    expect(response.body.data).toEqual({ sales: [{ id: "catty-sale" }] })
    expect(response.statusCode).toBe(200)
  })

  it("converts the string 'true' to a boolean", async () => {
    const response = await request(app)
      .post("/")
      .set("Accept", "application/json")
      .send({
        query: gql`
          query SalesQuery($is_auction: Boolean!) {
            sales(is_auction: $is_auction) {
              id
            }
          }
        `,
        variables: {
          is_auction: "false",
        },
      })

    // We are checking that this works w/ string variables
    expect(response.body.data).toEqual({ sales: [{ id: "catty-sale" }] })
    expect(response.statusCode).toBe(200)
  })

  it("converts the integer strings to integers", async () => {
    const response = await request(app)
      .post("/")
      .set("Accept", "application/json")
      .send({
        query: gql`
          query SalesQuery($size: Int!) {
            sales(size: $size) {
              id
            }
          }
        `,
        variables: {
          size: "1",
        },
      })

    // We are checking that this works w/ string variables
    expect(response.body.data).toEqual({ sales: [{ id: "catty-sale" }] })
    expect(response.statusCode).toBe(200)
  })
})
