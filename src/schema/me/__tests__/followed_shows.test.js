/* eslint-disable promise/always-return */
import { resolve } from "path"
import { readFileSync } from "fs"
import { runAuthenticatedQuery } from "test/utils"
import gql from "lib/gql"
import cityData from "../../../schema/city/cityDataSortedByDisplayPreference.json"
import { LOCAL_DISCOVERY_RADIUS_KM } from "../../../schema/city/constants"
import { getArgumentValues } from "graphql/execution/values"

const BASE_GRAVITY_ARGS = {
  size: 10,
  offset: 0,
  total_count: true,
}

const location_by_city_slug = cityData.reduce((acc, val) => {
  acc[val.slug] = val.coordinates
  return acc
}, {})

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

const getStub = () =>
  sinon.stub().returns(
    Promise.resolve({
      body: [],
      headers: {},
    })
  )

describe("returns followed shows for a user", () => {
  it("generates a predictable URL with no parameters", done => {
    const followedShowsLoader = getStub()
    const query = generate_query()
    runAuthenticatedQuery(query, {
      followedShowsLoader,
    }).then(data => {
      expect(followedShowsLoader.calledWith(BASE_GRAVITY_ARGS))
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
      it.call(this, `Handles ${city.name}`, done => {
        const followedShowsLoader = getStub()
        const { query, expectedArgs } = buildTestData(city)
        runAuthenticatedQuery(query, {
          followedShowsLoader,
        }).then(data => {
          expect(followedShowsLoader.calledWith(expectedArgs))
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
        followedShowsLoader: getStub(),
      })
        .then(data => {
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
