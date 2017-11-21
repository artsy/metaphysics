// @ts-check

import factories from "../api"
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"

export default (accessToken, userID, requestIDs) => {
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)
  const { gravityLoaderWithAuthenticationFactory } = factories(requestIDs)
  const gravityLoader = gravityLoaderWithAuthenticationFactory(gravityAccessTokenLoader)

  return {
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
    saleArtworksLoader: gravityLoader(id => `sale/${id}/sale_artworks`),
    suggestedArtistsLoader: gravityLoader("me/suggested/artists", {}, { headers: true }),
    followedArtistsLoader: gravityLoader("me/follow/artists", {}, { headers: true }),
    followedGenesLoader: gravityLoader("me/follow/genes", {}, { headers: true }),
    lotStandingLoader: gravityLoader("me/lot_standings"),
    authenticatedPopularArtistsLoader: gravityLoader("artists/popular"),
    updateMeLoader: gravityLoader("me", {}, { method: "PUT" }),
    updateCollectorProfileLoader: gravityLoader("me/collector_profile", {}, { method: "PUT" }),
  }
}
