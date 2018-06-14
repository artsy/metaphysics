// @ts-check

import factories from "../api"
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"

export default (accessToken, userID, opts) => {
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)
  const { gravityLoaderWithAuthenticationFactory } = factories(opts)
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
    collectorProfileLoader: gravityLoader("me/collector_profile"),
    createBidderLoader: gravityLoader("bidder", {}, { method: "POST" }),
    createCreditCardLoader: gravityLoader(
      "me/credit_cards",
      {},
      { method: "POST" }
    ),
    meCreditCardsLoader: gravityLoader("me/credit_cards", {}),
    followGeneLoader: gravityLoader("me/follow/gene", {}, { method: "POST" }),
    followedGeneLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/genes"),
      "genes",
      "is_followed",
      "gene"
    ),
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
    followedProfilesArtworksLoader: gravityLoader(
      "me/follow/profiles/artworks",
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
    homepageModulesLoader: gravityLoader("me/modules"),
    homepageSuggestedArtworksLoader: gravityLoader(
      "me/suggested/artworks/homepage"
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
    meBidderPositionLoader: gravityLoader(
      ({ id }) => `me/bidder_position/${id}/`,
      {},
      { headers: true }
    ),
    createBidderPositionLoader: gravityLoader(
      "me/bidder_position",
      {},
      { method: "POST" }
    ),
    mePartnersLoader: gravityLoader("me/partners"),
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
    saleArtworksLoader: gravityLoader(
      id => `sale/${id}/sale_artworks`,
      {},
      { headers: true }
    ),
    endSaleLoader: gravityLoader(
      id => `sale/${id}/end_sale`,
      {},
      { method: "PUT" }
    ),
    savedArtworksLoader: gravityLoader("collection/saved-artwork/artworks", {
      user_id: userID,
      private: true,
    }),
    filterArtworksLoader: gravityLoader("filter/artworks"),
    saleArtworksAllLoader: gravityLoader(
      "sale_artworks",
      {},
      { headers: true }
    ),
    saleArtworksFilterLoader: gravityLoader("filter/sale_artworks"),
    suggestedArtistsLoader: gravityLoader(
      "me/suggested/artists",
      {},
      { headers: true }
    ),
    suggestedSimilarArtistsLoader: gravityLoader(
      `user/${userID}/suggested/similar/artists`,
      {},
      { headers: true }
    ),
    updateCollectorProfileLoader: gravityLoader(
      "me/collector_profile",
      {},
      { method: "PUT" }
    ),
    updateMeLoader: gravityLoader("me", {}, { method: "PUT" }),
    orderLoader: gravityLoader(id => `order/${id}`, {}, { headers: true }),
    confirmOrderLoader: gravityLoader(
      id => `order/${id}`,
      { state: "approved" },
      { method: "PUT" }
    ),
    finalizeOrderLoader: gravityLoader(
      id => `order/${id}`,
      { state: "finalized" },
      { method: "PUT" }
    ),
    rejectOrderLoader: gravityLoader(
      id => `order/${id}`,
      { state: "rejected" },
      { method: "PUT" }
    ),
    updateOrderLoader: gravityLoader(
      id => `me/order/${id}`,
      {},
      { method: "PUT" }
    ),
    submitOrderLoader: gravityLoader(
      id => `me/order/${id}/submit`,
      {},
      { method: "PUT" }
    ),
    recordArtworkViewLoader: gravityLoader(
      "me/recently_viewed_artworks",
      {},
      { method: "POST" }
    ),
    followArtistLoader: gravityLoader(
      "me/follow/artist",
      {},
      { method: "POST" }
    ),
    unfollowArtistLoader: gravityLoader(
      id => `me/follow/artist/${id}`,
      {},
      { method: "DELETE" }
    ),
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
    usersLoader: gravityLoader("users"),
  }
}
