import { error } from "./loggers"
import { RequestHandler } from "express"
import config from "config"

export const nameOldEigenQueries: RequestHandler = (req, _res, next) => {
  const agent = req.headers["user-agent"]
  if (req.body.query && agent && agent.includes("Eigen")) {
    const { query } = req.body as { query: string }

    if (shouldAddQueryToMutations(query)) {
      const newQuery = addQueryToMutations(query)
      if (newQuery) {
        req.body.query = newQuery
      } else {
        error(`Unexpected Eigen query: ${query}`)
      }
    }

    if (shouldRewriteEcommerceMutations(config, query)) {
      req.body.query = rewriteEcommerceMutations(query)
    }
  }

  next()
}

export const shouldAddQueryToMutations = (query: string) =>
  !query.trim().startsWith("query ") && !query.trim().startsWith("mutation")

export const addQueryToMutations = (query: string) => {
  if (query.includes("saved_artworks")) {
    // https://github.com/artsy/eigen/blob/master/Artsy/Networking/favorites.graphql
    return `query FavoritesQuery ${query}`
  } else if (query.includes("sale_artworks")) {
    // https://github.com/artsy/eigen/blob/master/Artsy/Networking/artworks_in_sale.graphql
    return `query ArtworksInSaleQuery ${query}`
  } else if (query.includes("totalUnreadCount")) {
    // https://github.com/artsy/eigen/blob/master/Artsy/Networking/conversations.graphql
    return `query TotalUnreadCountQuery ${query}`
  }

  return undefined
}

export const shouldRewriteEcommerceMutations = (config: any, query: string) =>
  config.ENABLE_COMMERCE_STITCHING &&
  (query.includes("ecommerceCreateOrderWithArtwork") ||
    query.includes("ecommerceCreateOfferOrderWithArtwork"))

export const rewriteEcommerceMutations = (query: string) => {
  const befores = [
    "... on OrderWithMutationSuccess",
    "... on OrderWithMutationFailure",
    "CreateOrderWithArtworkInput",
    "ecommerceCreateOfferOrderWithArtwork(",
    "ecommerceCreateOrderWithArtwork(",
  ]
  const afters = [
    // Different type names
    "... on CommerceOrderWithMutationSuccess",
    "... on CommerceOrderWithMutationFailure",
    "CommerceCreateOrderWithArtworkInput",
    // Different root fields, but we need to ensure they get the
    // same response shape.
    "ecommerceCreateOfferOrderWithArtwork: commerceCreateOfferOrderWithArtwork(",
    "ecommerceCreateOrderWithArtwork: commerceCreateOrderWithArtwork(",
  ]

  befores.forEach((before) => {
    if (query.includes(before)) {
      const index = befores.indexOf(before)
      query = query.replace(before, afters[index])
    }
  })

  return query
}
