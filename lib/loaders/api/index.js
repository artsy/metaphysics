import gravity from "lib/apis/gravity"
import impulse from "lib/apis/impulse"
import positron from "lib/apis/positron"
import convection from "lib/apis/convection"

import { apiLoaderWithAuthenticationFactory } from "lib/loaders/api/loader_with_authentication_factory"
import { apiLoaderWithoutAuthenticationFactory } from "lib/loaders/api/loader_without_authentication_factory"

export default requestID => {
  return {
    /**
     * The Gravity loaders produced by this factory _will_ cache all responses to memcache.
     *
     * Do **not** use it for authenticated requests!
     */
    get gravityLoaderWithoutAuthenticationFactory() {
      return apiLoaderWithoutAuthenticationFactory(gravity, requestID)
    },

    /**
     * The Positron loaders produced by this factory _will_ cache all responses to memcache.
     *
     * Do **not** use it for authenticated requests!
     */
    get positronLoaderWithoutAuthenticationFactory() {
      return apiLoaderWithoutAuthenticationFactory(positron)
    },

    /**
     * The Gravity loaders produced by this factory _will_ cache responses for the duration of query execution but do
     * **not** cache to memcache.
     *
     * Use this for authenticated requests.
     */
    get gravityLoaderWithAuthenticationFactory() {
      return apiLoaderWithAuthenticationFactory(gravity, requestID)
    },

    /**
   * The Convection loaders produced by this factory _will_ cache responses for the duration of query execution but do
   * **not** cache to memcache.
   *
   * Use this for authenticated requests.
   */
    get convectionLoaderWithAuthenticationFactory() {
      return apiLoaderWithAuthenticationFactory(convection)
    },

    /**
     * The Impulse loaders produced by this factory _will_ cache responses for the duration of query execution but do
     * **not** cache to memcache.
     *
     * Use this for authenticated requests.
     */
    get impulseLoaderWithAuthenticationFactory() {
      return apiLoaderWithAuthenticationFactory(impulse)
    },
  }
}
