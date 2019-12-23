import factories from "../api"
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"

export default (accessToken, userID, opts) => {
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)
  const { gravityLoaderWithAuthenticationFactory } = factories(opts)
  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )

  return {
    createAccountRequestLoader: gravityLoader(
      "account_requests",
      {},
      { method: "POST" }
    ),
    artworkLoader: gravityLoader(id => `artwork/${id}`),
    authenticatedArtworkVersionLoader: gravityLoader(
      id => `artwork_version/${id}`
    ),
    collectionArtworksLoader: gravityLoader(
      id => `collection/${id}/artworks`,
      { user_id: userID },
      { headers: true }
    ),
    collectionLoader: gravityLoader(id => `collection/${id}`, {
      user_id: userID,
    }),
    collectorProfileLoader: gravityLoader("me/collector_profile"),
    createBidderLoader: gravityLoader("bidder", {}, { method: "POST" }),
    createBidderPositionLoader: gravityLoader(
      "me/bidder_position",
      {},
      { method: "POST" }
    ),
    createCreditCardLoader: gravityLoader(
      "me/credit_cards",
      {},
      { method: "POST" }
    ),
    creditCardLoader: gravityLoader(id => `credit_card/${id}`),
    deleteArtworkLoader: gravityLoader(
      id => `collection/saved-artwork/artwork/${id}`,
      {},
      { method: "DELETE" }
    ),
    deleteCreditCardLoader: gravityLoader(
      id => `me/credit_card/${id}`,
      {},
      { method: "DELETE" }
    ),
    endSaleLoader: gravityLoader(
      id => `sale/${id}/end_sale`,
      {},
      { method: "PUT" }
    ),
    filterArtworksLoader: gravityLoader("filter/artworks"),
    followArtistLoader: gravityLoader(
      "me/follow/artist",
      {},
      { method: "POST" }
    ),
    followedArtistsArtworksLoader: gravityLoader(
      "me/follow/artists/artworks",
      {},
      { headers: true }
    ),
    followedArtistsLoader: gravityLoader(
      "me/follow/artists",
      {},
      { headers: true }
    ),
    followedArtistLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/artists"),
      {
        paramKey: "artists",
        trackingKey: "is_followed",
        entityKeyPath: "artist",
      }
    ),
    followedGeneLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/genes"),
      {
        paramKey: "genes",
        trackingKey: "is_followed",
        entityKeyPath: "gene",
      }
    ),
    followedGenesLoader: gravityLoader<
      { gene: { id: string; name: string } }[]
    >("me/follow/genes", {}, { headers: true }),
    followedProfilesArtworksLoader: gravityLoader(
      "me/follow/profiles/artworks",
      {},
      { headers: true }
    ),
    followGeneLoader: gravityLoader("me/follow/gene", {}, { method: "POST" }),
    followProfileLoader: gravityLoader(
      "me/follow/profile",
      {},
      { method: "POST" }
    ),
    followedProfileLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/profiles"),
      {
        paramKey: "profiles",
        trackingKey: "is_followed",
        entityKeyPath: "profile",
      }
    ),
    followShowLoader: gravityLoader("follow_shows", {}, { method: "POST" }),
    unfollowShowLoader: gravityLoader("follow_shows", {}, { method: "DELETE" }),
    followedShowsLoader: gravityLoader("follow_shows", {}, { headers: true }),
    followedShowLoader: trackedEntityLoaderFactory(
      gravityLoader("follow_shows"),
      {
        paramKey: "show_ids",
        trackingKey: "is_followed",
        entityKeyPath: "partner_show",
        entityIDKeyPath: "_id",
      }
    ),
    followedFairsLoader: gravityLoader(
      "/me/follow/profiles",
      {},
      { headers: true }
    ),
    followedPartnersLoader: gravityLoader(
      "/me/follow/profiles",
      {},
      { headers: true }
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
    meBidderPositionLoader: gravityLoader(
      id => `me/bidder_position/${id}/`,
      {},
      { headers: true }
    ),
    meBidderPositionsLoader: gravityLoader("me/bidder_positions"),
    meBiddersLoader: gravityLoader("me/bidders"),
    meCreditCardsLoader: gravityLoader(
      "me/credit_cards",
      {},
      { headers: true }
    ),
    meLoader: gravityLoader("me"),
    mePartnersLoader: gravityLoader("me/partners"),
    notificationsFeedLoader: gravityLoader("me/notifications/feed"),
    popularArtistsLoader: gravityLoader("artists/popular"),
    recordArtworkViewLoader: gravityLoader(
      "me/recently_viewed_artworks",
      {},
      { method: "POST" }
    ),
    saleArtworksAllLoader: gravityLoader(
      "sale_artworks",
      {},
      { headers: true }
    ),
    saleArtworksFilterLoader: gravityLoader("filter/sale_artworks"),
    saleArtworksLoader: gravityLoader(
      id => `sale/${id}/sale_artworks`,
      {},
      { headers: true }
    ),
    saveArtworkLoader: gravityLoader(
      id => `collection/saved-artwork/artwork/${id}`,
      {},
      { method: "POST" }
    ),
    savedArtworkLoader: trackedEntityLoaderFactory(
      gravityLoader("collection/saved-artwork/artworks", {
        user_id: userID,
        private: true,
      }),
      {
        paramKey: "artworks",
        trackingKey: "is_saved",
      }
    ),
    savedArtworksLoader: gravityLoader("collection/saved-artwork/artworks", {
      user_id: userID,
      private: true,
    }),
    sendFeedbackLoader: gravityLoader("feedback", {}, { method: "POST" }),
    showLoader: gravityLoader(id => `show/${id}`),
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
    unfollowArtistLoader: gravityLoader(
      id => `me/follow/artist/${id}`,
      {},
      { method: "DELETE" }
    ),
    unfollowProfileLoader: gravityLoader(
      id => `me/follow/profile/${id}`,
      {},
      { method: "DELETE" }
    ),
    updateCollectorProfileLoader: gravityLoader(
      "me/collector_profile",
      {},
      { method: "PUT" }
    ),
    updateMeLoader: gravityLoader("me", {}, { method: "PUT" }),
    usersLoader: gravityLoader("users"),
  }
}
