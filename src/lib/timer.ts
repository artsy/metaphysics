import { info } from "./loggers"
import { round } from "lodash"

export default (key) => {
  let time: ReturnType<typeof process.hrtime> | null = null

  return {
    start: () => {
      time = process.hrtime()
      info(`Loading: ${key}`)
      return time
    },

    end: () => {
      // Can invoke this multiple times without side-effects
      if (!time) return
      const end = process.hrtime(time)
      time = null
      const interval = `${end[0]}s ${round(end[1] / 1000000, 3)}ms`
      info(`Elapsed: ${interval} - ${key}`)
      return interval
    },
  }
}
