// @ts-check

import gravity from "lib/apis/gravity"
import impulse from "lib/apis/impulse"
import positron from "lib/apis/positron"
import convection from "lib/apis/convection"
import gemini from "lib/apis/gemini"

import { apiLoaderWithAuthenticationFactory } from "lib/loaders/api/loader_with_authentication_factory"
import { apiLoaderWithoutAuthenticationFactory } from "lib/loaders/api/loader_without_authentication_factory"
import { loaderOneOffFactory } from "lib/loaders/api/loader_one_off_factory"

export default requestID => ({
  /**
   * The Gravity loaders produced by this factory _will_ cache all responses to memcache.
   *
   * Do **not** use it for authenticated requests!
   */
  gravityLoaderWithoutAuthenticationFactory: apiLoaderWithoutAuthenticationFactory(gravity, { requestID }),

  /**
   * The Positron loaders produced by this factory _will_ cache all responses to memcache.
   *
   * Do **not** use it for authenticated requests!
   */
  positronLoaderWithoutAuthenticationFactory: apiLoaderWithoutAuthenticationFactory(positron),

  /**
   * The Gravity loaders produced by this factory _will_ cache responses for the duration of query execution but do
   * **not** cache to memcache.
   *
   * Use this for authenticated requests.
   */
  gravityLoaderWithAuthenticationFactory: apiLoaderWithAuthenticationFactory(gravity, { requestID }),

  /**
   * The Impulse loaders produced by this factory _will_ cache responses for the duration of query execution but do
   * **not** cache to memcache.
   *
   * Use this for authenticated requests.
   */
  impulseLoaderWithAuthenticationFactory: apiLoaderWithAuthenticationFactory(impulse),

  /**
   * The Convection loaders produced by this factory _will_ cache responses for the duration of query execution but do
   * **not** cache to memcache.
   *
   * Use this for authenticated requests.
   */
  convectionLoaderWithAuthenticationFactory: apiLoaderWithAuthenticationFactory(convection),

  /**
   * The Gravity loaders produced by this factory _will not_ cache any responses to memcache.
   *
   * You may use it for authenticated requests.
   */
  gravityLoaderWithoutAuthenticationWithoutCachingFactory: loaderOneOffFactory(gravity),

  /**
   * The Gemini loaders produced by this factory _will not_ cache any responses to memcache.
   */
  geminiLoader: loaderOneOffFactory(gemini),
})
