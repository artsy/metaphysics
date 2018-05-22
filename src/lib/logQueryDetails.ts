import { error } from "./loggers"
import { RequestHandler } from "express"

export function logQueryDetails(threshold: number) {
  const logQueryDetailsMiddleware: RequestHandler = (req, res, next) => {
    const start = process.hrtime()
    res.on("finish", () => {
      const duration = process.hrtime(start)
      if (duration[0] >= threshold) {
        error(`Query passed threshold:\n${JSON.stringify(req.body, null, 2)}`)
      }
    })
    next()
  }
  return logQueryDetailsMiddleware
}
