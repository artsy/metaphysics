import queryMap from "../data/complete.queryMap.json"
import { info, error } from "./loggers"
import { RequestHandler } from "express"

export const fetchPersistedQuery: RequestHandler = (req, res, next) => {
  const { documentID } = req.body
  if (documentID) {
    const query = queryMap[documentID]
    if (query) {
      info(`Serving persisted query with ID ${documentID}`)
      req.body.query = query // eslint-disable-line no-param-reassign
    } else {
      const message = `Unable to serve persisted query with ID ${documentID}`
      error(message)
      res.status(404).send(message).end()
      return
    }
  }
  next()
}
