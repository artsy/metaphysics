import { Client } from "memjs"
import config from "config"

const { NODE_ENV } = process.env
const { CACHE_LIFETIME_IN_SECONDS } = config

export default () => {
  if (NODE_ENV === "test") {
    const store = {}
    return {
      store,
      get: (key, cb) => cb(null, store[key]),
      set: (key, data) => (store[key] = data),
    }
  }
  return Client.create(null, {
    expires: CACHE_LIFETIME_IN_SECONDS,
  })
}
