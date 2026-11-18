import zlib from "zlib"
import { createHash } from "crypto"
import { isArray } from "lodash"
import config from "config"
import { error, verbose } from "./loggers"
import Memcached from "memcached"
import { createCacheTracer } from "./tracer"
import { createStatsClient } from "./stats"

const {
  NODE_ENV,
  MEMCACHED_URL,
  MEMCACHED_MAX_POOL,
  CACHE_COMPRESSION_DISABLED,
  CACHE_LIFETIME_IN_SECONDS,
  CACHE_NAMESPACE,
  CACHE_RETRIEVAL_TIMEOUT_MS,
} = config

const isTest = NODE_ENV === "test"

const VerboseEvents = [
  "issue",
  "failure",
  "reconnecting",
  "reconnect",
  "remove",
]

const uncompressedKeyPrefix = "::"
const cacheVersion = "v1"

// memcached silently drops keys longer than 250 bytes, so long URLs — batch /
// id-list loaders like `articles/counts?artist_ids[]=…` — never cache. Hash any
// key that would exceed the limit. Short keys are returned verbatim (byte-for-
// byte identical to before), so no existing entry changes and there's no cold
// cache flush; only previously-uncacheable long keys start caching.
const MAX_KEY_LENGTH = 250

const keyPrefix = () =>
  CACHE_COMPRESSION_DISABLED
    ? CACHE_NAMESPACE + uncompressedKeyPrefix
    : CACHE_NAMESPACE + cacheVersion

export const cacheKey = (key) => {
  const prefix = keyPrefix()
  const fullKey = prefix + key
  if (fullKey.length <= MAX_KEY_LENGTH) {
    return fullKey
  }
  return prefix + "h:" + createHash("md5").update(String(key)).digest("hex")
}

const deflateP = (dataz) => {
  return new Promise<Buffer>((resolve, reject) =>
    zlib.deflate(JSON.stringify(dataz), (err, deflatedData) => {
      if (err) {
        reject(err)
      } else {
        resolve(deflatedData)
      }
    })
  )
}

function createMockClient() {
  const store = {}
  return {
    store,
    get: (key, cb) => cb(null, store[key]),
    set: (key, data, _options, cb) => {
      store[key] = data
      cb()
    },
    del: (key, cb) => {
      delete store[key]
      cb()
    },
    // Just to satisfy rate-limit-memcached
    increment: (_key, _value, cb) => cb(false),
  }
}

function createMemcachedClient() {
  const client = new Memcached(MEMCACHED_URL, {
    poolSize: MEMCACHED_MAX_POOL,
  })
  VerboseEvents.forEach((event) => {
    client.on(event, () => verbose(`[Cache] ${event}`))
  })
  return client
}

export const client = isTest ? createMockClient() : createMemcachedClient()

const cacheTracer: ReturnType<typeof createCacheTracer> = isTest
  ? { get: (x) => x, set: (x) => x, delete: (x) => x }
  : createCacheTracer()

const statsClient = isTest ? null : createStatsClient()

// First path segment only (e.g. `artist`, `sale`, `articles`) — a small,
// bounded set of loader roots. The rest of the path carries IDs
// (`artist/<id>`, `sale/<id>/sale_artwork/<id>`) and a client can force a long
// key with a long id, so tagging the full path would explode Datadog tag
// cardinality (billed per unique combination, multiplied by `pod_name`).
const keyRoot = (key) => String(key).split(/[/?]/)[0]

// Count cache operations whose raw key exceeds memcached's limit and so gets
// hashed — i.e. keys that previously silently missed. `cache.key_hashed` broken
// down by `root` in Datadog shows which loaders were affected.
const trackKeyLength = (key) => {
  if (keyPrefix().length + String(key).length > MAX_KEY_LENGTH) {
    statsClient?.increment("cache.key_hashed", 1, { root: keyRoot(key) })
  }
}

function _get<T>(key) {
  trackKeyLength(key)
  return new Promise<T>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
      timeoutId = null
      const err = new Error(`[Cache#get] Timeout for key ${cacheKey(key)}`)
      statsClient.increment("cache.timeout")
      error(err)
      reject(err)
    }, CACHE_RETRIEVAL_TIMEOUT_MS)

    client.get(cacheKey(key), (err, data) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      } else {
        // timed out and already rejected promise, no need to continue
        return
      }

      if (err) {
        error(err)
        reject(err)
      } else if (data) {
        if (CACHE_COMPRESSION_DISABLED) {
          resolve(JSON.parse(data.toString()))
        } else {
          zlib.inflate(Buffer.from(data, "base64"), (er, inflatedData) => {
            if (er) {
              reject(er)
            } else {
              resolve(JSON.parse(inflatedData.toString()))
            }
          })
        }
      } else {
        reject()
      }
    })
  })
}

export interface CacheOptions {
  cacheTtlInSeconds?: number
}

function _set(key, data, options: CacheOptions) {
  trackKeyLength(key)
  const timestamp = new Date().getTime()
  /* eslint-disable no-param-reassign */
  if (isArray(data)) {
    data.forEach((datum) => {
      datum && (datum.cached = timestamp)
    })
  } else {
    data.cached = timestamp
  }
  /* eslint-enable no-param-reassign */

  const cacheTtl = options.cacheTtlInSeconds || CACHE_LIFETIME_IN_SECONDS
  if (CACHE_COMPRESSION_DISABLED) {
    return new Promise<void>((resolve, reject) => {
      const payload = JSON.stringify(data)
      verbose(`CACHE SET: ${cacheKey(key)}: ${payload}`)
      client.set(cacheKey(key), payload, cacheTtl, (err) => {
        err ? reject(err) : resolve()
      })
    }).catch(error)
  } else {
    return deflateP(data)
      .then((deflatedData) => {
        const payload = deflatedData.toString("base64")
        verbose(`CACHE SET: ${cacheKey(key)}: ${payload}`)

        return new Promise<void>((resolve, reject) => {
          client.set(cacheKey(key), payload, cacheTtl, (err) =>
            err ? reject(err) : resolve()
          )
        })
      })
      .catch(error)
  }
}

const _delete = (key) =>
  new Promise<void>((resolve, reject) =>
    client.del(cacheKey(key), (err) => {
      err ? reject(err) : resolve()
    })
  )

export default {
  get: <T = any>(key: string) => {
    return cacheTracer.get(_get<T>(key))
  },

  set: (key: string, data: any, options: CacheOptions = {}) => {
    return cacheTracer.set(_set(key, data, options))
  },

  delete: (key: string) => {
    return cacheTracer.delete(_delete(key))
  },
}
