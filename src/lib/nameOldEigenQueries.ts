import { error } from "./loggers"
import { RequestHandler } from "express"

export const nameOldEigenQueries: RequestHandler = (req, _res, next) => {
  const agent = req.headers["user-agent"]
  if (req.body.query && agent && agent.includes("Eigen")) {
    const { query } = req.body as { query: string }
    if (!query.startsWith("query ")) {
      if (query.includes("saved_artworks")) {
        // https://github.com/artsy/eigen/blob/master/Artsy/Networking/favorites.graphql
        req.body.query = `query FavoritesQuery ${query}`
      } else if (query.includes("sale_artworks")) {
        // https://github.com/artsy/eigen/blob/master/Artsy/Networking/artworks_in_sale.graphql
        req.body.query = `query ArtworksInSaleQuery ${query}`
      } else if (query.includes("totalUnreadCount")) {
        // https://github.com/artsy/eigen/blob/master/Artsy/Networking/conversations.graphql
        req.body.query = `query TotalUnreadCountQuery ${query}`
      } else {
        error(`Unexpected Eigen query: ${query}`)
      }
    }
  }
  next()
}
