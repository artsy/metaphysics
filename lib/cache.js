import { isNull, isArray } from "lodash"
import { error } from "./loggers"

import createClient from "lib/loaders/cache/client"
export const client = createClient()

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
    if (isArray(data)) {
      data.map(datum => (datum.cached = timestamp)) // eslint-disable-line no-param-reassign
    } else {
      data.cached = timestamp // eslint-disable-line no-param-reassign
    }

    return client.set(key, JSON.stringify(data), err => {
      if (err) error(err)
    })
  },

  delete: key =>
    new Promise((resolve, reject) =>
      client.delete(key, (err, response) => {
        if (err) return reject(err)
        resolve(response)
      })
    ),
}
