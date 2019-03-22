/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"
import gql from "lib/gql"
import cityData from "../../../schema/city/cityDataSortedByDisplayPreference.json"
import { LOCAL_DISCOVERY_RADIUS_KM } from "../../../schema/city/constants"

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
    const query = generate_query(`(first: 10, city-slug: "this-is-not-a-city")`)
    try {
      await runAuthenticatedQuery(query, { followedShowsLoader })
      // shouldn't get here - if we did then the error wasn't thrown.
      expect(true).toBeFalsy()
    } catch (e) {
      expect(e).toBeDefined()
    }
  })

  it("relies on the state of cityData", () => {
    // if you update cityData, please make sure
    // you update these tests to capture your changes.
    // the behavior of this query is tightly coupled
    // the state of cityData
    cityData
      .map(({ name, slug, coordinates: { lat, lng } }) => ({
        name,
        slug,
        lat,
        lng,
      }))
      .forEach(city => {
        expect(city).toMatchSnapshot({
          name: expect.any(String),
          slug: expect.any(String),
          lat: expect.any(Number),
          lng: expect.any(Number),
        })
      })
  })
})
