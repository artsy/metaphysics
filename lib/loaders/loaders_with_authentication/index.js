import factories from "../api"
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"

import convectionLoaders from "./convection"
import impulseLoaders from "./impulse"

export default (accessToken, userID, requestID) => {
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)
  const { gravityLoaderWithAuthenticationFactory } = factories(requestID)
  const gravityLoader = gravityLoaderWithAuthenticationFactory(gravityAccessTokenLoader)

  const loaders = {
    // Gravity
    followedArtistLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/artists"),
      "artists",
      "is_followed",
      "artist"
    ),
    followedProfileLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/profiles"),
      "profiles",
      "is_followed",
      "profile"
    ),
    savedArtworkLoader: trackedEntityLoaderFactory(
      gravityLoader("collection/saved-artwork/artworks", {
        user_id: userID,
        private: true,
      }),
      "artworks",
      "is_saved"
    ),
    suggestedArtistsLoader: gravityLoader("me/suggested/artists"),
    lotStandingLoader: gravityLoader("me/lot_standings"),
    authenticatedPopularArtistsLoader: gravityLoader("artists/popular"),
    ...convectionLoaders(accessToken, requestID),
    ...impulseLoaders(accessToken, userID, requestID),
  }
  return loaders
}
