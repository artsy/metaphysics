import { error } from "./loggers"
import { RequestHandler } from "express"

export const checkForProblematicArtistQuery: RequestHandler = (
  req,
  res,
  next
) => {
  const { query } = req.body
  if (query && query.includes("Overview_artist_3vi6l5")) {
    error(`Problematic artist query, IP: ${req.ip}`)
    return res.status(500).end()
  }
  next()
}
