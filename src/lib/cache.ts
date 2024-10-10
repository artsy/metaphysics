import zlib from "zlib"
import { isArray } from "lodash"
import config from "config"
import { error, verbose } from "./loggers"
import { MemcacheClient } from "memcache-client"
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

const uncompressedKeyPrefix = "::"
const cacheVersion = "v1"

export const cacheKey = (key) => {
  if (CACHE_COMPRESSION_DISABLED) {
    return CACHE_NAMESPACE + uncompressedKeyPrefix + key
  } else {
    return CACHE_NAMESPACE + cacheVersion + key
  }
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
  console.log("hey")
  const newClient = new MemcacheClient({
    server: { server: MEMCACHED_URL, maxConnections: MEMCACHED_MAX_POOL },
  })
  return newClient
}

export const client = isTest ? createMockClient() : createMemcachedClient()

const cacheTracer: ReturnType<typeof createCacheTracer> = isTest
  ? { get: (x) => x, set: (x) => x }
  : createCacheTracer()

const statsClient = isTest ? null : createStatsClient()

function _get<T>(key) {
  return new Promise<T>((resolve, reject) => {
    let timeoutId: NodeJS.Timer | null = setTimeout(() => {
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
          resolve(JSON.parse(data.value.toString()))
        } else {
          zlib.inflate(
            Buffer.from(data.value, "base64"),
            (er, inflatedData) => {
              if (er) {
                reject(er)
              } else {
                resolve(JSON.parse(inflatedData.toString()))
              }
            }
          )
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
      client.set(cacheKey(key), payload, { lifetime: cacheTtl }, (err) => {
        err ? reject(err) : resolve()
      })
    }).catch(error)
  } else {
    return deflateP(data)
      .then((deflatedData) => {
        const payload = deflatedData.toString("base64")
        verbose(`CACHE SET: ${cacheKey(key)}: ${payload}`)

        return new Promise<void>((resolve, reject) => {
          client.set(cacheKey(key), payload, { lifetime: cacheTtl }, (err) =>
            err ? reject(err) : resolve()
          )
        })
      })
      .catch(error)
  }
}

export default {
  get: <T = any>(key: string) => {
    return cacheTracer.get(_get<T>(key))
  },

  set: (key: string, data: any, options: CacheOptions = {}) => {
    return cacheTracer.set(_set(key, data, options))
  },
}
