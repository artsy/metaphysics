// @ts-check

import factories from "../api"
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"

export default (accessToken, userID, requestIDs) => {
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)
  const { gravityLoaderWithAuthenticationFactory } = factories(requestIDs)
  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )

  return {
    collectionLoader: gravityLoader(id => `collection/${id}`, {
      user_id: userID,
    }),
    collectionArtworksLoader: gravityLoader(
      id => `collection/${id}/artworks`,
      { user_id: userID },
      { headers: true }
    ),
    followGeneLoader: gravityLoader("me/follow/gene", {}, { method: "POST" }),
    followedArtistLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/artists"),
      "artists",
      "is_followed",
      "artist"
    ),
    followedArtistsLoader: gravityLoader(
      "me/follow/artists",
      {},
      { headers: true }
    ),
    followedArtistsArtworksLoader: gravityLoader(
      "me/follow/artists/artworks",
      {},
      { headers: true }
    ),
    followedGenesLoader: gravityLoader(
      "me/follow/genes",
      {},
      { headers: true }
    ),
    followedProfileLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/profiles"),
      "profiles",
      "is_followed",
      "profile"
    ),
    inquiryRequestsLoader: gravityLoader(
      "me/inquiry_requests",
      {},
      { headers: true }
    ),
    lotStandingLoader: gravityLoader("me/lot_standings"),
    meLoader: gravityLoader("me"),
    meBiddersLoader: gravityLoader("me/bidders"),
    meBidderPositionsLoader: gravityLoader("me/bidder_positions"),
    notificationsFeedLoader: gravityLoader("me/notifications/feed"),
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
    filterArtworksLoader: gravityLoader("filter/artworks"),
    saleArtworksAllLoader: gravityLoader("sale_artworks"),
    saleArtworksFilterLoader: gravityLoader("filter/sale_artworks"),
    suggestedArtistsLoader: gravityLoader(
      "me/suggested/artists",
      {},
      { headers: true }
    ),
    updateCollectorProfileLoader: gravityLoader(
      "me/collector_profile",
      {},
      { method: "PUT" }
    ),
    updateMeLoader: gravityLoader("me", {}, { method: "PUT" }),
    saveArtworkLoader: gravityLoader(
      id => `collection/saved-artwork/artwork/${id}`,
      {},
      { method: "POST" }
    ),
    deleteArtworkLoader: gravityLoader(
      id => `collection/saved-artwork/artwork/${id}`,
      {},
      { method: "DELETE" }
    ),
  }
}
