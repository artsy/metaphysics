import zlib from 'zlib'
import { isNull, isArray } from "lodash"
import config from "config"
import { error, verbose } from "./loggers"
import Memcached from "memcached"
import { cacheTracer } from "./tracer"
import { statsClient } from "./stats"

const {
  NODE_ENV,
  MEMCACHED_URL,
  MEMCACHED_MAX_POOL,
  CACHE_LIFETIME_IN_SECONDS,
  CACHE_QUERY_LOGGING_THRESHOLD_MS,
  CACHE_RETRIEVAL_TIMEOUT_MS,
} = config

const isTest = NODE_ENV === "test"

const VerboseEvents = ["issue", "failure", "reconnecting", "reconnect", "remove"]

const deflateP = (dataz) => {
  return new Promise((resolve, reject) =>
    zlib.deflate(JSON.stringify(dataz), (er, deflatedData) => {
      if (er) {
        error(er)
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
    set: (key, data) => (store[key] = data),
    del: key => delete store[key],
  }
}

function createMemcachedClient() {
  const client = new Memcached(MEMCACHED_URL, {
    poolSize: MEMCACHED_MAX_POOL
  })
  VerboseEvents.forEach(event => {
    client.on(event, () => verbose(`[Cache] ${event}`))
  })
  return client
}

export const client = isTest ? createMockClient() : createMemcachedClient()

function _get(key) {
  return new Promise((resolve, reject) => {
    if (isNull(client)) return reject(new Error("[Cache] `client` is `null`"))

    let timeoutId = setTimeout(() => {
      timeoutId = null
      const err = new Error(`[Cache#get] Timeout for key ${key}`)
      statsClient.increment('cache.timeout')
      error(err)
      reject(err)
    }, CACHE_RETRIEVAL_TIMEOUT_MS)

    const start = Date.now()
    client.get(key, (err, data) => {
      const time = Date.now() - start
      if (time > CACHE_QUERY_LOGGING_THRESHOLD_MS) {
        error(`[Cache#get] Slow read of ${time}ms for key ${key}`)
        statsClient.timing('cache.slow_read', time)
      }

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
        zlib.inflate(new Buffer(data, 'base64'), (er, inflatedData) => {
          if (er) {
            reject(er)
          } else {
            resolve(JSON.parse(inflatedData.toString()))
          }
        })
      } else {
        reject(new Error("[Cache#get] Cache miss"))
      }
    })
  })
}

function _set(key, data) {
  if (isNull(client)) return false

  const timestamp = new Date().getTime()
  /* eslint-disable no-param-reassign */
  if (isArray(data)) {
    data.forEach(datum => (datum.cached = timestamp))
  } else {
    data.cached = timestamp
  }
  /* eslint-enable no-param-reassign */

  return deflateP(data).then(deflatedData => {
    const payload = deflatedData.toString('base64')
    verbose(`CACHE SET: ${key}: ${payload}`)
    return client.set(
      key,
      payload,
      CACHE_LIFETIME_IN_SECONDS,
      err => {
        if (err) error(err)
      }
    )
  }).catch(err => {
    error(err)
  })
}

const _delete = (key) =>
  new Promise((resolve, reject) =>
    client.del(key, (err) => {
      if (err) return reject(err)
    })
  )


function finishSpan(span, promise) {
  return promise.then(
    result => {
      span.finish()
      return result
    }, err => {
      span.finish()
      throw err
    })
}

export default {
  get: key => {
    return cacheTracer().then(span => {
      span.setTag("resource.name", "get")
      return finishSpan(span, _get(key))
    })
  },

  set: (key, data) => {
    return cacheTracer().then(span => {
      span.setTag("resource.name", "set")
      return finishSpan(span, _set(key, data))
    })
  },

  delete: key => {
    return cacheTracer().then(span => {
      span.setTag("resource.name", "delete")
      return finishSpan(span, _delete(key))
    })
  },

  isAvailable: () => {
    return new Promise((resolve, reject) => {
      client.stats((err, resp) => {
        if (err) {
          error(err)
          reject(err)
        } else {
          resolve(resp)
        }
      })
    })
  }
}
