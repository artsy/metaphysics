/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { LOCAL_DISCOVERY_RADIUS_KM } from "schema/v2/city/constants"
import { TCity } from "schema/v2/city"

const stubResolver = () => Promise.resolve({ body: [], headers: {} })

const generate_query = (params = `(first: 10)`) =>
  gql`
    {
      me {
        followsAndSaves {
          showsConnection${params} {
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
    const assertStatusSupported = async (status) => {
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

    const assertInvalidStatusFails = async (status) => {
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
      await assertStatusSupported("closed")
      await assertStatusSupported("running")
      await assertStatusSupported("upcoming")
      await assertStatusSupported("closing_soon")
      await assertStatusSupported("running_and_upcoming")
    })

    it("throws an error if an unsupported status is supplied", async () => {
      await assertInvalidStatusFails("random_invalid_status")
    })
  })

  describe("filter by city", () => {
    it("generates a predictable URL with a city slug input", async () => {
      const nyc: TCity = {
        name: "New York",
        full_name: "New York, NY, USA",
        slug: "new-york-ny-usa",
        coords: [40.71, -74.01],
      }
      expect(nyc.slug).toBe("new-york-ny-usa")
      const query = generate_query(`(first: 10, city: "${nyc.slug}")`)
      await runAuthenticatedQuery(query, {
        followedShowsLoader,
        geodataCitiesLoader: () => Promise.resolve([nyc]),
      })
      expect(followedShowsLoader).toHaveBeenCalledWith({
        size: 10,
        offset: 0,
        total_count: true,
        near: `${nyc.coords[0]},${nyc.coords[1]}`,
        max_distance: LOCAL_DISCOVERY_RADIUS_KM,
      })
    })

    it("throws an error if presented with an invalid city slug", async () => {
      const query = generate_query(`(first: 10, city: "this-is-not-a-city")`)
      await expect(
        runAuthenticatedQuery(query, {
          followedShowsLoader,
          geodataCitiesLoader: () => Promise.resolve([]),
        })
      ).rejects.toMatchInlineSnapshot(`[Error: Cannot find valid city]`)
    })
  })
})
