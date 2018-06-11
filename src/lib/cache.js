import util from 'util'
import zlib from 'zlib'
import { isNull, isArray } from "lodash"
import config from "config"
import { error, verbose } from "./loggers"
import redis from "redis"
import url from "url"

const {
  NODE_ENV,
  REDIS_URL,
  CACHE_LIFETIME_IN_SECONDS,
  CACHE_QUERY_LOGGING_THRESHOLD_MS,
  CACHE_RETRIEVAL_TIMEOUT_MS,
} = config

const isTest = NODE_ENV === "test"

const VerboseEvents = ["connect", "ready", "reconnecting", "end", "warning"]

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

function createRedisClient() {
  const redisURL = url.parse(REDIS_URL)
  const client = redis.createClient({
    host: redisURL.hostname,
    port: redisURL.port,
    retryStrategy: options => {
      if (options.error) {
        // Errors that lead to the connection being dropped are not emitted to
        // the error event handler, so send it there ourselves so we can handle
        // it in one place.
        // See https://github.com/NodeRedis/node_redis/issues/1202#issuecomment-363116620
        client.emit("error", error)
        // End reconnecting on a specific error and flush all commands with a
        // individual error.
        if (options.error.code === "ECONNREFUSED") {
          return new Error("[Cache] The server refused the connection")
        }
      }
      // End reconnecting after a specific timeout and flush all commands with a
      // individual error.
      if (options.total_retry_time > 1000 * 60 * 60) {
        return new Error("[Cache] Retry time exhausted")
      }
      // End reconnecting with built in error.
      if (options.attempt > 10) {
        return undefined
      }
      // Reconnect after:
      return Math.min(options.attempt * 100, 3000)
    },
  })
  if (redisURL.auth) {
    client.auth(redisURL.auth.split(":")[1])
  }
  client.on("error", error)
  VerboseEvents.forEach(event => {
    client.on(event, () => verbose(`[Cache] ${event}`))
  })
  return client
}

export const client = isTest ? createMockClient() : createRedisClient()

export default {
  get: key => {
    return new Promise((resolve, reject) => {
      if (isNull(client)) return reject(new Error("[Cache] `client` is `null`"))

      let timeoutId = setTimeout(() => {
        timeoutId = null
        const err = new Error(`[Cache#get] Timeout for key ${key}`)
        error(err)
        reject(err)
      }, CACHE_RETRIEVAL_TIMEOUT_MS)

      const start = Date.now()
      client.get(key, (err, data) => {
        const time = Date.now() - start
        if (time > CACHE_QUERY_LOGGING_THRESHOLD_MS) {
          error(`[Cache#get] Slow read of ${time}ms for key ${key}`)

          const clientInfo = {
            ready: client.ready,
            connected: client.connected,
            shouldBuffer: client.shouldBuffer,
            commandQueueLength: client.commandQueueLength,
            offlineQueueLength: client.offlineQueueLength,
            pipelineQueueLength: client.pipeline_queue.length
          }
          verbose(`Redis Client Info: ${util.inspect(clientInfo)}`)
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
  },

  set: (key, data) => {
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
        "EX",
        CACHE_LIFETIME_IN_SECONDS,
        err => {
          if (err) error(err)
        }
      )
    }).catch(err => {
      error(err)
    })
  },

  delete: key =>
    new Promise((resolve, reject) =>
      client.del(key, (err, response) => {
        if (err) return reject(err)
        resolve(response)
      })
    ),
}
