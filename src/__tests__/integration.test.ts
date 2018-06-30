import request from "supertest"
import app from "../index"
import gql from "test/gql"

jest.mock("lib/apis/fetch", () => jest.fn())
import fetch from "lib/apis/fetch"
const mockFetch = fetch as jest.Mock

// These tests ensure that *any* query works against our express app.

it("It should bail for an unknown GET request", async () => {
  const response = await request(app).get("/")
  expect(response.statusCode).toBe(400)
})

it("It can make a request against the schema", async () => {
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
