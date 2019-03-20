/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"
import gql from "lib/gql"
import cityData from "../../../schema/city/cityDataSortedByDisplayPreference.json"
import { LOCAL_DISCOVERY_RADIUS_KM } from "../../../schema/city/constants"

const BASE_GRAVITY_ARGS = {
  size: 10,
  offset: 0,
  total_count: true,
}

const stubResolver = () =>
  Promise.resolve({
    body: [],
    headers: {},
  })

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

  const expectArgs = args =>
    followedShowsLoader.mock.calls.some(val => args === val)

  it("generates a predictable URL with no parameters", done => {
    const query = generate_query()
    runAuthenticatedQuery(query, {
      followedShowsLoader,
    }).then(_data => {
      expectArgs(BASE_GRAVITY_ARGS)
      done()
    })
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
      query: generate_query(`(first: 10, city: "${city.slug}")`),
      expectedArgs: generate_city_args(city),
    })

    cityData.forEach(city => {
      it.call(null, `Handles ${city.name}`, done => {
        const { query, expectedArgs } = buildTestData(city)
        runAuthenticatedQuery(query, {
          followedShowsLoader,
        }).then(_data => {
          expectArgs(expectedArgs)
          done()
        })
      })
    })

    it("throws an error if presented with an invalid city slug", done => {
      const { query } = buildTestData({
        slug: "invalid-city-location",
        coordinates: { lat: 0, lng: 0 },
      })

      runAuthenticatedQuery(query, {
        followedShowsLoader,
      })
        .then(_data => {
          // should never get here
          expect(true).toEqual(false)
          done()
        })
        .catch(e => {
          expect(e).toBeDefined()
          done()
        })
    })
  })
})
