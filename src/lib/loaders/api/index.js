// @ts-check
import config from "config"

import convection from "lib/apis/convection"
import delta from "lib/apis/delta"
import diffusion from "lib/apis/diffusion"
import galaxy from "lib/apis/galaxy"
import gravity from "lib/apis/gravity"
import impulse from "lib/apis/impulse"
import positron from "lib/apis/positron"

import { apiLoaderWithAuthenticationFactory } from "lib/loaders/api/loader_with_authentication_factory"
import { apiLoaderWithoutAuthenticationFactory } from "lib/loaders/api/loader_without_authentication_factory"

export default requestIDs => ({
  // Unauthenticated loaders

  /**
   * The Delta loaders produced by this factory _will_ cache all responses to memcache.
   */
  deltaLoaderWithoutAuthenticationFactory: apiLoaderWithoutAuthenticationFactory(
    delta,
    "delta",
    {
      requestIDs,
    }
  ),

  /**
   * The Diffusion loaders produced by this factory _will_ cache all responses to memcache.
   */
  diffusionLoaderWithoutAuthenticationFactory: apiLoaderWithoutAuthenticationFactory(
    diffusion,
    "diffusion",
    {
      requestIDs,
      requestThrottleMs: config.DIFFUSION_REQUEST_THROTTLE_MS,
    }
  ),

  /**
   * The Galaxy loaders produced by this factory _will_ cache all responses to memcache.
   *
   * Do **not** use it for authenticated requests!
   */
  galaxyLoaderWithoutAuthenticationFactory: apiLoaderWithoutAuthenticationFactory(
    galaxy,
    "galaxy",
    { requestIDs }
  ),

  /**
   * The Gravity loaders produced by this factory _will_ cache all responses to memcache.
   *
   * Do **not** use it for authenticated requests!
   */
  gravityLoaderWithoutAuthenticationFactory: apiLoaderWithoutAuthenticationFactory(
    gravity,
    "gravity",
    { requestIDs }
  ),

  /**
   * The Positron loaders produced by this factory _will_ cache all responses to memcache.
   *
   * Do **not** use it for authenticated requests!
   */
  positronLoaderWithoutAuthenticationFactory: apiLoaderWithoutAuthenticationFactory(
    positron,
    "positron",
    {
      requestIDs,
    }
  ),

  // Authenticated loaders

  /**
   * The Convection loaders produced by this factory _will_ cache responses for the duration of query execution but do
   * **not** cache to memcache.
   *
   * Use this for authenticated requests.
   */
  convectionLoaderWithAuthenticationFactory: apiLoaderWithAuthenticationFactory(
    convection,
    "convection",
    {
      requestIDs,
    }
  ),

  /**
   * The Gravity loaders produced by this factory _will_ cache responses for the duration of query execution but do
   * **not** cache to memcache.
   *
   * Use this for authenticated requests.
   */
  gravityLoaderWithAuthenticationFactory: apiLoaderWithAuthenticationFactory(
    gravity,
    "gravity",
    { requestIDs }
  ),

  /**
   * The Impulse loaders produced by this factory _will_ cache responses for the duration of query execution but do
   * **not** cache to memcache.
   *
   * Use this for authenticated requests.
   */
  impulseLoaderWithAuthenticationFactory: apiLoaderWithAuthenticationFactory(
    impulse,
    "impulse",
    { requestIDs }
  ),
})
