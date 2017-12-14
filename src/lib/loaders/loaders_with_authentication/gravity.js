// @ts-check

import factories from "../api"
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"

export default (accessToken, userID, requestIDs) => {
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)
  const { gravityLoaderWithAuthenticationFactory } = factories(requestIDs)
  const gravityLoader = gravityLoaderWithAuthenticationFactory(gravityAccessTokenLoader)

  return {
    followGeneLoader: gravityLoader("me/follow/gene", {}, { method: "POST" }),
    followedArtistLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/artists"),
      "artists",
      "is_followed",
      "artist"
    ),
    followedArtistsLoader: gravityLoader("me/follow/artists", {}, { headers: true }),
    followedArtistsArtworksLoader: gravityLoader("me/follow/artists/artworks", {}, { headers: true }),
    followedGenesLoader: gravityLoader("me/follow/genes", {}, { headers: true }),
    followedProfileLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/profiles"),
      "profiles",
      "is_followed",
      "profile"
    ),
    lotStandingLoader: gravityLoader("me/lot_standings"),
    popularArtistsLoader: gravityLoader("artists/popular"),
    savedArtworkLoader: trackedEntityLoaderFactory(
      gravityLoader("collection/saved-artwork/artworks", {
        user_id: userID,
        private: true,
      }),
      "artworks",
      "is_saved"
    ),
    saleArtworksLoader: gravityLoader(id => `sale/${id}/sale_artworks`),
    saleArtworksFilterLoader: gravityLoader("filter/sale_artworks"),
    suggestedArtistsLoader: gravityLoader("me/suggested/artists", {}, { headers: true }),
    updateCollectorProfileLoader: gravityLoader("me/collector_profile", {}, { method: "PUT" }),
    updateMeLoader: gravityLoader("me", {}, { method: "PUT" }),
  }
}
