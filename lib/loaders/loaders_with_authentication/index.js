import { gravityLoaderWithAuthenticationFactory } from "../api"
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"

import convectionLoaders from "./convection"
import impulseLoaders from "./impulse"

<<<<<<< HEAD
export default (accessToken, userID) => {
=======
export default (accessToken, userID, requestID) => {
  let impulseTokenLoader
>>>>>>> send request id to gravity
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)
  const gravityLoader = gravityLoaderWithAuthenticationFactory(gravityAccessTokenLoader)

  const loaders = {
    // Gravity
    followedArtistLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/artists", {}, { requestID }),
      "artists",
      "is_followed",
      "artist"
    ),
    followedProfileLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/profiles", {}, { requestID }),
      "profiles",
      "is_followed",
      "profile"
    ),
    savedArtworkLoader: trackedEntityLoaderFactory(
      gravityLoader(
        "collection/saved-artwork/artworks",
        {
          user_id: userID,
          private: true,
        },
        { requestID }
      ),
      "artworks",
      "is_saved"
    ),
    ...convectionLoaders(accessToken),
    ...impulseLoaders(accessToken, userID),
  }
  return loaders
}
