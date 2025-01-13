import config from "config"

import convection from "lib/apis/convection"
import delta from "lib/apis/delta"
import diffusion from "lib/apis/diffusion"
import galaxy from "lib/apis/galaxy"
import geodata from "lib/apis/geodata"
import gravity from "lib/apis/gravity"
import impulse from "lib/apis/impulse"
import positron from "lib/apis/positron"
import { vortex } from "lib/apis/vortex"
import { ipbase } from "lib/apis/ipbase"
import { unleash } from "lib/apis/unleash"

import { apiLoaderWithAuthenticationFactory } from "lib/loaders/api/loader_with_authentication_factory"
import { apiLoaderWithoutAuthenticationFactory } from "lib/loaders/api/loader_without_authentication_factory"

export type API = (
  path: string,
  token?: string | null,
  apiOptions?: any
) => Promise<any>

export interface APIOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  requestIDs?: {
    requestID: string
    xForwardedFor: string
  }
  userAgent?: string
  headers?: boolean
  appToken?: string

  /** This only applies to caching loaders */
  requestThrottleMs?: number

  // Is this loader being used during a request that includes a mutation?
  // If so, loaders can skip the cache (even if they typically would cache).
  // This is to ensure any fetched data in the mutation response is fresh.
  isMutation?: boolean
}

export interface DataLoaderKey {
  key: string
  apiOptions?: APIOptions
}

export default (opts) => ({
  // Unauthenticated loaders

  /**
   * The Convection loaders produced by this factory _will_ cache all responses to memcache.
   */
  convectionLoaderWithoutAuthenticationFactory: apiLoaderWithoutAuthenticationFactory(
    convection,
    "convection",
    {
      requestIDs: opts.requestIDs,
      userAgent: opts.userAgent,
    }
  ),

  /**
   * The Delta loaders produced by this factory _will_ cache all responses to memcache.
   */
  deltaLoaderWithoutAuthenticationFactory: apiLoaderWithoutAuthenticationFactory(
    delta,
    "delta",
    {
      requestIDs: opts.requestIDs,
      userAgent: opts.userAgent,
    }
  ),

  /**
   * The Diffusion loaders produced by this factory _will_ cache all responses to memcache.
   */
  diffusionLoaderWithoutAuthenticationFactory: apiLoaderWithoutAuthenticationFactory(
    diffusion,
    "diffusion",
    {
      requestIDs: opts.requestIDs,
      userAgent: opts.userAgent,
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
    {
      requestIDs: opts.requestIDs,
      userAgent: opts.userAgent,
    }
  ),

  /**
   * The Geodata loaders produced by this factory _will_ cache all responses to memcache.
   *
   * Do **not** use it for authenticated requests!
   */
  geodataLoaderWithoutAuthenticationFactory: apiLoaderWithoutAuthenticationFactory(
    geodata,
    "geodata",
    {
      requestIDs: opts.requestIDs,
      userAgent: opts.userAgent,
    }
  ),

  /**
   * The Gravity loaders produced by this factory _will_ cache all responses to memcache.
   *
   * Do **not** use it for authenticated requests!
   */
  gravityLoaderWithoutAuthenticationFactory: apiLoaderWithoutAuthenticationFactory(
    gravity,
    "gravity",
    {
      requestIDs: opts.requestIDs,
      userAgent: opts.userAgent,
      appToken: opts.appToken,
      isMutation: opts.isMutation,
    }
  ),

  /**
   * The ipbase loaders produced by this factory _will_ cache all responses to memcache.
   *
   * Do **not** use it for authenticated requests!
   */
  ipbaseLoaderWithoutAuthenticationFactory: apiLoaderWithoutAuthenticationFactory(
    ipbase,
    "ipbase",
    {
      requestIDs: opts.requestIDs,
      userAgent: opts.userAgent,
      requestThrottleMs: config.IPBASE_REQUEST_THROTTLE_MS,
    }
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
      requestIDs: opts.requestIDs,
      userAgent: opts.userAgent,
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
      requestIDs: opts.requestIDs,
      userAgent: opts.userAgent,
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
    opts
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
    {
      requestIDs: opts.requestIDs,
      userAgent: opts.userAgent,
    }
  ),

  /**
   * The Unleash loaders produced by this factory _will_ cache responses for the duration of query execution but do
   * **not** cache to memcache.
   *
   * Use this for authenticated requests.
   */
  unleashLoaderWithAuthenticationFactory: apiLoaderWithAuthenticationFactory(
    unleash,
    "unleash",
    {
      requestIDs: opts.requestIDs,
      userAgent: opts.userAgent,
    }
  ),

  /**
   * The Vortex loaders produced by this factory _will_ cache responses for the duration of query execution but do
   * **not** cache to memcache.
   *
   * Use this for authenticated requests.
   */
  vortexLoaderWithAuthenticationFactory: apiLoaderWithAuthenticationFactory(
    vortex,
    "vortex",
    {
      requestIDs: opts.requestIDs,
      userAgent: opts.userAgent,
    }
  ),

  // Loaders created by this factory are used by an email provider to fetch some user-specific data,
  // and depend on the xapp token instead of the user's access token.
  // For this reason, we can't use the standard apiLoaderWithAuthenticationFactory as that is access-token based.
  // Additionally, we do want to skip the cache for these loaders, and so `uncachedLoaderFactory` would be more
  // appropriate, but that is too brittle to use w/o more refactoring.
  // We can take advantage of the fact that GraphQL requests are POSTs and so skip the cache anyway.
  vortexLoaderWithoutAuthenticationFactory: apiLoaderWithoutAuthenticationFactory(
    vortex,
    "vortex",
    opts
  ),
})
