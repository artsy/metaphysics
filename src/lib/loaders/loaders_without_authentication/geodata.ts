import { compact } from "lodash"
import { TCity } from "schema/v2/city"
import factories from "../api"

/** The cities data may have nulls in it */
type Response = (TCity | null)[]

export default (opts) => {
  const {
    geodataLoaderWithoutAuthenticationFactory: geodataLoader,
  } = factories(opts)

  return {
    geodataCitiesLoader: () =>
      geodataLoader<Response>("partner-cities/cities.json")().then(compact),
    geodataFeaturedCitiesLoader: () =>
      geodataLoader<Response>("partner-cities/featured-cities.json")().then(
        compact
      ),
  }
}
