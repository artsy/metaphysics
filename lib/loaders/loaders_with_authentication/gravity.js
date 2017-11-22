// @ts-check

import factories from "../api"
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"

export default (accessToken, userID, requestIDs) => {
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)
  const { gravityLoaderWithAuthenticationFactory } = factories(requestIDs)
  const gravityLoader = gravityLoaderWithAuthenticationFactory(gravityAccessTokenLoader)

  return {
    authenticatedPopularArtistsLoader: gravityLoader("artists/popular"),
    authenticatedSaleArtworksFilterLoader: gravityLoader("filter/sale_artworks"),
    followedArtistLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/artists"),
      "artists",
      "is_followed",
      "artist"
    ),
    followedArtistsLoader: gravityLoader("me/follow/artists", {}, { headers: true }),
    followedGenesLoader: gravityLoader("me/follow/genes", {}, { headers: true }),
    followedProfileLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/profiles"),
      "profiles",
      "is_followed",
      "profile"
    ),
    lotStandingLoader: gravityLoader("me/lot_standings"),
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
    updateCollectorProfileLoader: gravityLoader("me/collector_profile", {}, { method: "PUT" }),
    updateMeLoader: gravityLoader("me", {}, { method: "PUT" }),
  }
}
