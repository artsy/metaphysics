import { info } from "./loggers"
import { round } from "lodash"

export default key => {
  const start = process.hrtime()

  return {
    start: () => {
      info(`Loading: ${key}`)
      return start
    },

    end: () => {
      const end = process.hrtime(start)
      const interval = `${end[0]}s ${round(end[1] / 1000000, 3)}ms`
      info(`Elapsed: ${interval} - ${key}`)
      return interval
    },
  }
}
