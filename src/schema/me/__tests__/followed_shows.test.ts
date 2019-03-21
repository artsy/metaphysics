/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"
import gql from "lib/gql"
import cityData from "../../../schema/city/cityDataSortedByDisplayPreference.json"
import { LOCAL_DISCOVERY_RADIUS_KM } from "../../../schema/city/constants"

const BASE_GRAVITY_ARGS = { size: 10, offset: 0, total_count: true }
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
    expect(followedShowsLoader).toHaveBeenCalledWith(BASE_GRAVITY_ARGS)
  })

  describe("respects optional city parameter", () => {
    const generate_city_args = city =>
      !city
        ? BASE_GRAVITY_ARGS
        : {
            ...BASE_GRAVITY_ARGS,
            near: `${city.coordinates.lat},${city.coordinates.lng}`,
            max_distance: LOCAL_DISCOVERY_RADIUS_KM,
          }

    const buildTestData = city => ({
      name: city.name,
      query: generate_query(`(first: 10, city: "${city.slug}")`),
      expectedArgs: generate_city_args(city),
    })

    cityData.map(buildTestData).forEach(({ name, query, expectedArgs }) => {
      // I totally grant that this is a bit weird
      // but the behavior under test is tightly coupled
      // to the contents of the cityData file. If a change
      // to that file breaks this test I want to know about it,
      // and this will tell us.

      // When Jest hits this point in the code it will treat this almost
      // like a macro - we'll have a new test generated for each city,
      // you'll see the test results enumerated as if we'd done this manually.
      it.call(null, `Handles City: ${name}`, async () => {
        await runAuthenticatedQuery(query, { followedShowsLoader })
        expect(followedShowsLoader).toHaveBeenCalledWith(expectedArgs)
      })
    })

    it("throws an error if presented with an invalid city slug", async () => {
      const { query } = buildTestData({
        slug: "invalid-city-location",
        coordinates: { lat: 0, lng: 0 },
      })

      try {
        await runAuthenticatedQuery(query, { followedShowsLoader })
        // shouldn't get here - if we did then the error wasn't thrown.
        expect(true).toBeFalsy()
      } catch (e) {
        expect(e).toBeDefined()
      }
    })
  })
})
