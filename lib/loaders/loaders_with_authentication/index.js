import { gravityLoaderWithAuthenticationFactory } from "../api"
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"

import convectionLoaders from "./convection"
import impulseLoaders from "./impulse"

export default (accessToken, userID, options) => {
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)
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
    lotStandingLoader: gravityLoader("me/lot_standings", options),
    ...convectionLoaders(accessToken),
    ...impulseLoaders(accessToken, userID),
  }
  return loaders
}
