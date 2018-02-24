import { isNull, isArray } from "lodash"
import config from "config"
import { error, verbose } from "./loggers"
import redis from "redis"
import url from "url"

const { NODE_ENV, OPENREDIS_URL } = process.env
const { CACHE_LIFETIME_IN_SECONDS } = config

const isTest = NODE_ENV === "test"

const VerboseEvents = ["connect", "ready", "reconnecting", "end", "warning"]

function createMockClient() {
  const store = {}
  return {
    store,
    get: (key, cb) => cb(null, store[key]),
    set: (key, data) => (store[key] = data),
  }
}

function createRedisClient() {
  const redisURL = url.parse(OPENREDIS_URL)
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
          return new Error("The server refused the connection")
        }
      }
      // End reconnecting after a specific timeout and flush all commands with a
      // individual error.
      if (options.total_retry_time > 1000 * 60 * 60) {
        return new Error("Retry time exhausted")
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
    client.on(event, () => verbose(`Redis: ${event}`))
  })
  return client
}

export const client = isTest ? createMockClient() : createRedisClient()

export default {
  get: key => {
    return new Promise((resolve, reject) => {
      if (isNull(client)) return reject(new Error("Cache client is `null`"))

      client.get(key, (err, data) => {
        if (err) return reject(err)
        if (data) return resolve(JSON.parse(data))
        reject(new Error("cache#get did not return `data`"))
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

    return client.set(
      key,
      JSON.stringify(data),
      "EX",
      CACHE_LIFETIME_IN_SECONDS,
      err => {
        if (err) error(err)
      }
    )
  },

  delete: key =>
    new Promise((resolve, reject) =>
      client.del(key, (err, response) => {
        if (err) return reject(err)
        resolve(response)
      })
    ),
}
