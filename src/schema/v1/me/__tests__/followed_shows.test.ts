/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v1/test/utils"
import gql from "lib/gql"
import cityData from "schema/v1/city/cityDataSortedByDisplayPreference.json"
import { LOCAL_DISCOVERY_RADIUS_KM } from "schema/v1/city/constants"

const stubResolver = () => Promise.resolve({ body: [], headers: {} })

const generate_query = (params = `(first: 10)`) =>
  gql`
    {
      me {
        followsAndSaves {
          shows${params} {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    }
  `

describe("returns followed shows for a user", () => {
  let followedShowsLoader

  beforeEach(() => {
    followedShowsLoader = jest.fn(stubResolver)
  })

  it("generates a predictable URL with no parameters", async () => {
    const query = generate_query()
    await runAuthenticatedQuery(query, { followedShowsLoader })
    expect(followedShowsLoader).toHaveBeenCalledWith({
      size: 10,
      offset: 0,
      total_count: true,
    })
  })

  describe("filter by status", () => {
    const assert_status_supported = async (status) => {
      const query = generate_query(
        `(first: 10, status: ${status.toUpperCase()})`
      )
      await runAuthenticatedQuery(query, { followedShowsLoader })
      expect(followedShowsLoader).toHaveBeenCalledWith({
        size: 10,
        offset: 0,
        total_count: true,
        status: status,
      })
    }

    const assert_invalid_status_fails = async (status) => {
      const query = generate_query(
        `(first: 10, status: ${status.toUpperCase()})`
      )
      await expect(
        runAuthenticatedQuery(query, { followedShowsLoader })
      ).rejects.toMatchInlineSnapshot(
        `[GraphQLError: Expected type EventStatus, found RANDOM_INVALID_STATUS.]`
      )
    }

    it("handles all supported status definitions", async () => {
      await assert_status_supported("closed")
      await assert_status_supported("running")
      await assert_status_supported("upcoming")
      await assert_status_supported("closing_soon")
      await assert_status_supported("running_and_upcoming")
    })

    it("throws an error if an unsupported status is supplied", async () => {
      await assert_invalid_status_fails("random_invalid_status")
    })
  })

  describe("filter by city", () => {
    it("generates a predictable URL with a city slug input", async () => {
      const nyc = cityData[0]
      expect(nyc.slug).toBe("new-york-ny-usa")
      const query = generate_query(`(first: 10, city: "${nyc.slug}")`)
      await runAuthenticatedQuery(query, { followedShowsLoader })
      expect(followedShowsLoader).toHaveBeenCalledWith({
        size: 10,
        offset: 0,
        total_count: true,
        near: `${nyc.coordinates.lat},${nyc.coordinates.lng}`,
        max_distance: LOCAL_DISCOVERY_RADIUS_KM,
      })
    })

    it("throws an error if presented with an invalid city slug", async () => {
      const query = generate_query(`(first: 10, city: "this-is-not-a-city")`)
      await expect(
        runAuthenticatedQuery(query, { followedShowsLoader })
      ).rejects.toMatchInlineSnapshot(
        `[Error: City slug must be one of: new-york-ny-usa, los-angeles-ca-usa, london-united-kingdom, berlin-germany, paris-france, hong-kong-hong-kong]`
      )
    })

    it("relies on the state of cityData", () => {
      cityData
        .map((city) => ({
          name: city.name,
          slug: city.slug,
          lat: city.coordinates.lat,
          lng: city.coordinates.lng,
        }))
        .forEach((city) => {
          expect(city).toMatchObject({
            name: expect.any(String),
            slug: expect.any(String),
            lat: expect.any(Number),
            lng: expect.any(Number),
          })
        })
    })
  })
})
