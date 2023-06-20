/* eslint-disable promise/always-return */

import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("requestLocation", () => {
  describe("when ip param is not provided", () => {
    it("returns location based request header IP", async () => {
      const query = gql`
        {
          requestLocation {
            id
            country
            countryCode
          }
        }
      `

      const requestLocationLoader = jest.fn(async () => locationResponse)

      const context = {
        requestLocationLoader,
        ipAddress: "request-ip",
      }

      const { requestLocation } = await runAuthenticatedQuery(query, context)

      expect(requestLocationLoader).toHaveBeenCalledWith({ ip: "request-ip" })

      expect(requestLocation).toMatchInlineSnapshot(`
        Object {
          "country": "Germany",
          "countryCode": "de",
          "id": "cmVxdWVzdC1pcA==",
        }
      `)
    })
  })

  describe("when `ip` param is provided", () => {
    it("returns location based param IP", async () => {
      const query = gql`
        {
          requestLocation(ip: "param-ip") {
            id
            country
            countryCode
          }
        }
      `

      const requestLocationLoader = jest.fn(async () => locationResponse)

      const context = {
        requestLocationLoader,
        ipAddress: "request-ip",
      }

      const { requestLocation } = await runAuthenticatedQuery(query, context)

      expect(requestLocationLoader).toHaveBeenCalledWith({ ip: "param-ip" })

      expect(requestLocation).toMatchInlineSnapshot(`
        Object {
          "country": "Germany",
          "countryCode": "de",
          "id": "cGFyYW0taXA=",
        }
      `)
    })
  })
})

const locationResponse = {
  body: {
    data: {
      location: {
        country: {
          alpha2: "de",
          name: "Germany",
        },
      },
    },
  },
}
