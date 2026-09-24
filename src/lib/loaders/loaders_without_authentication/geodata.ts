import { compact } from "lodash"
import { TCity } from "schema/v2/city"
import factories from "../api"

/** The cities data may have nulls in it */
type Response = (TCity | null)[]

export default (opts) => {
  const {
    geodataLoaderWithoutAuthenticationFactory: geodataLoader,
  } = factories(opts)

  // Built once per request so repeat calls, one per show in a list, share one fetch.
  const citiesLoader = geodataLoader<Response>("partner-cities/cities.json")
  const featuredCitiesLoader = geodataLoader<Response>(
    "partner-cities/featured-cities.json"
  )

  return {
    geodataCitiesLoader: () => citiesLoader().then(compact),
    geodataFeaturedCitiesLoader: () => featuredCitiesLoader().then(compact),
  }
}
