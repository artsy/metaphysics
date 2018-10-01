// @ts-check

import loadersWithAuthentication from "./loaders_with_authentication"
import loadersWithoutAuthentication from "./loaders_without_authentication"

/**
 * Creates a new set of data loaders for all routes. These should be created for each GraphQL query and passed to the
 * `graphql` query execution function.
 *
 * Only if credentials are provided will the set include authenticated loaders, so before using an authenticated loader
 * it would be wise to check if the loader is not in fact `undefined`.
 */
export default (accessToken, userID, opts) => {
  const loaders = loadersWithoutAuthentication(opts)
  if (accessToken) {
    return Object.assign(
      {},
      loaders,
      loadersWithAuthentication(accessToken, userID, opts)
    )
  }
  return loaders
}
