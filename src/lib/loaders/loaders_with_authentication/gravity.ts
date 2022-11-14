import factories from "../api"
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"

export default (accessToken, userID, opts) => {
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)
  const { gravityLoaderWithAuthenticationFactory } = factories(opts)
  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )

  return {
    identityVerificationsLoader: gravityLoader(
      "identity_verifications",
      {},
      { headers: true }
    ),
    identityVerificationOverridesLoader: gravityLoader(
      (id) => `identity_verification/${id}/overrides`
    ),
    createIdentityVerificationOverrideLoader: gravityLoader(
      (id) => `identity_verification/${id}/override`,
      {},
      { method: "POST" }
    ),
    identityVerificationScanReferencesLoader: gravityLoader(
      (id) => `identity_verification/${id}/scan_references`
    ),
    sendIdentityVerificationEmailLoader: gravityLoader(
      `identity_verification`,
      {},
      { method: "POST" }
    ),
    artistDuplicatesLoader: gravityLoader(
      (id) => `artist/${id}/duplicates`,
      {},
      { headers: true }
    ),
    mergeArtistLoader: gravityLoader("artists/merge", {}, { method: "POST" }),
    artworkLoader: gravityLoader((id) => `artwork/${id}`),
    notificationPreferencesLoader: gravityLoader("notification_preferences"),
    updateNotificationPreferencesLoader: gravityLoader(
      "notification_preferences",
      {},
      { method: "POST" }
    ),
    authenticatedArtworkVersionLoader: gravityLoader(
      (id) => `artwork_version/${id}`
    ),
    authenticationsLoader: gravityLoader(
      "me/authentications",
      {},
      { headers: true }
    ),
    bankAccountLoader: gravityLoader((id) => `bank_account/${id}`),
    collectionArtworksLoader: gravityLoader(
      (id) => `collection/${id}/artworks`,
      { user_id: userID },
      { headers: true }
    ),
    collectionArtistsLoader: gravityLoader(
      (id) => `collection/${id}/artists`,
      { user_id: userID },
      { headers: true }
    ),
    collectionLoader: gravityLoader((id) => `collection/${id}`, {
      user_id: userID,
    }),
    collectorProfilesLoader: gravityLoader(
      "collector_profiles",
      {},
      { headers: true }
    ),
    createAccountRequestLoader: gravityLoader(
      "account_requests",
      {},
      { method: "POST" }
    ),
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
    createUserInterestLoader: gravityLoader(
      "me/user_interest",
      {},
      { method: "POST" }
    ),
    creditCardLoader: gravityLoader((id) => `credit_card/${id}`),
    deleteSavedArtworkLoader: gravityLoader(
      (id) => `collection/saved-artwork/artwork/${id}`,
      {},
      { method: "DELETE" }
    ),
    deleteDislikedArtworkLoader: gravityLoader(
      (id) => `collection/disliked-artwork/artwork/${id}`,
      {},
      { method: "DELETE" }
    ),
    deleteBankAccountLoader: gravityLoader(
      (id) => `me/bank_account/${id}`,
      {},
      { method: "DELETE" }
    ),
    deleteCreditCardLoader: gravityLoader(
      (id) => `me/credit_card/${id}`,
      {},
      { method: "DELETE" }
    ),
    deleteUserInterestLoader: gravityLoader(
      (id) => `me/user_interest/${id}`,
      {},
      { method: "DELETE" }
    ),
    deleteUserAccountLoader: gravityLoader("me", {}, { method: "DELETE" }),
    endSaleLoader: gravityLoader(
      (id) => `sale/${id}/end_sale`,
      {},
      { method: "PUT" }
    ),
    dislikeArtworkLoader: gravityLoader(
      (id) => `collection/disliked-artwork/artwork/${id}`,
      {},
      { method: "POST" }
    ),
    dislikedArtworkLoader: trackedEntityLoaderFactory(
      gravityLoader("collection/disliked-artwork/artworks", {
        user_id: userID,
        private: true,
      }),
      {
        paramKey: "artworks",
        trackingKey: "is_disliked",
        entityIDKeyPath: "_id",
      }
    ),
    filterArtworksLoader: gravityLoader("filter/artworks"),
    authenticatedArtistLoader: gravityLoader((id) => `artist/${id}`),
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
    followedArtistsShowsLoader: gravityLoader(
      "me/follow/artists/shows",
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
    unfollowGeneLoader: gravityLoader(
      (geneID) => `me/follow/gene/${geneID}`,
      {},
      { method: "DELETE" }
    ),
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
    inquiryIntroductionLoader: gravityLoader(
      "me/inquiry_introduction",
      {},
      { method: "POST" }
    ),
    inquiryRequestsLoader: gravityLoader(
      "me/inquiry_requests",
      {},
      { headers: true }
    ),
    submitArtworkInquiryRequestLoader: gravityLoader(
      "me/artwork_inquiry_request",
      {},
      { method: "POST" }
    ),
    linkAuthenticationLoader: gravityLoader(
      (provider) => `me/authentications/${provider}`,
      {},
      { method: "POST" }
    ),
    lotStandingLoader: gravityLoader("me/lot_standings", { size: 100 }),
    matchUsersLoader: gravityLoader("match/users", {}, { headers: true }),
    meBankAccountsLoader: gravityLoader(
      "me/bank_accounts",
      {},
      { headers: true }
    ),
    meBidderPositionLoader: gravityLoader(
      (id) => `me/bidder_position/${id}/`,
      {},
      { headers: true }
    ),
    meBidderPositionsLoader: gravityLoader("me/bidder_positions"),
    meBiddersLoader: gravityLoader("me/bidders"),
    meCollectorProfileLoader: gravityLoader("me/collector_profile"),
    meCreditCardsLoader: gravityLoader(
      "me/credit_cards",
      {},
      { headers: true }
    ),
    meLoader: gravityLoader("me"),
    mePartnersLoader: gravityLoader("me/partners"),
    createArtistLoader: gravityLoader("artist", {}, { method: "POST" }),
    createArtworkLoader: gravityLoader("artwork", {}, { method: "POST" }),
    createArtworkImageLoader: gravityLoader(
      (id) => `artwork/${id}/image`,
      {},
      { method: "POST" }
    ),
    updateArtworkLoader: gravityLoader(
      (id) => `artwork/${id}`,
      {},
      { method: "PUT" }
    ),
    deleteArtworkLoader: gravityLoader(
      (id) => `artwork/${id}`,
      {},
      { method: "DELETE" }
    ),
    deleteArtworkImageLoader: gravityLoader<
      any,
      { artworkID: string; imageID: string }
    >(
      ({ artworkID, imageID }) => `artwork/${artworkID}/image/${imageID}`,
      {},
      { method: "DELETE" }
    ),
    createArtworkEditionSetLoader: gravityLoader(
      (artworkID) => `artwork/${artworkID}/edition_set`,
      {},
      { method: "POST" }
    ),
    updateArtworkEditionSetLoader: gravityLoader<
      any,
      { artworkId: string; editionSetId: string }
    >(
      ({ artworkId, editionSetId }) =>
        `artwork/${artworkId}/edition_set/${editionSetId}`,
      {},
      { method: "PUT" }
    ),
    deleteArtworkEditionSetLoader: gravityLoader<
      any,
      { artworkId: string; editionSetId: string }
    >(
      ({ artworkId, editionSetId }) =>
        `artwork/${artworkId}/edition_set/${editionSetId}`,
      {},
      { method: "DELETE" }
    ),
    updateNotificationsLoader: gravityLoader(
      "me/notifications",
      {},
      { method: "PUT" }
    ),
    notificationsFeedLoader: gravityLoader("me/notifications/feed"),
    partnerSearchShowsLoader: gravityLoader(
      (id) => `/match/partner/${id}/shows`,
      {},
      { headers: true }
    ),
    partnerSearchArtistsLoader: gravityLoader(
      (id) => `/match/partner/${id}/artists`,
      {},
      { headers: true }
    ),
    partnerSearchArtworksLoader: gravityLoader(
      (id) => `/match/partner/${id}/artworks`,
      {},
      { headers: true }
    ),
    partnerAllLoader: gravityLoader((id) => `partner/${id}/all`),
    partnerArtistDocumentsLoader: gravityLoader<
      any,
      { partnerID: string; artistID: string }
    >(
      ({ partnerID, artistID }) =>
        `partner/${partnerID}/artist/${artistID}/documents`,
      {},
      { headers: true }
    ),
    partnerArtworksLoader: gravityLoader(
      (id) => `partner/${id}/artworks`,
      {},
      { headers: true }
    ),
    partnerArtworksAllLoader: gravityLoader(
      (id) => `partner/${id}/artworks/all`,
      {},
      { headers: true }
    ),
    partnerArtistsAllLoader: gravityLoader(
      (id) => `partner/${id}/partner_artists/all`,
      {},
      { headers: true }
    ),
    partnerDocumentsLoader: gravityLoader<any, { id: string }>(
      (id) => `partner/${id}/documents`,
      {},
      { headers: true }
    ),
    partnerShowArtworksLoader: gravityLoader<
      any,
      { partner_id: string; show_id: string }
    >(
      ({ partner_id, show_id }) =>
        `partner/${partner_id}/show/${show_id}/artworks`,
      {},
      { headers: true }
    ),
    updatePartnerArtworksLoader: gravityLoader(
      (id) => `partner/${id}/artworks`,
      {},
      { method: "PUT" }
    ),
    partnerInquirerCollectorProfileLoader: gravityLoader<
      any,
      { partnerId: string; inquiryId: string }
    >(
      ({ partnerId, inquiryId }) =>
        `partner/${partnerId}/inquiry_request/${inquiryId}/collector_profile`
    ),
    partnerShowDocumentsLoader: gravityLoader<
      any,
      { partnerID: string; showID: string }
    >(
      ({ partnerID, showID }) =>
        `partner/${partnerID}/show/${showID}/documents`,
      {},
      { headers: true }
    ),
    popularArtistsLoader: gravityLoader("artists/popular"),
    recordArtworkViewLoader: gravityLoader(
      "me/recently_viewed_artworks",
      {},
      { method: "POST" }
    ),
    requestPriceEstimateLoader: gravityLoader(
      "me/request_price_estimate",
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
      (id) => `sale/${id}/sale_artworks`,
      {},
      { headers: true }
    ),
    salesLoaderWithHeaders: gravityLoader("sales", {}, { headers: true }),
    saveArtworkLoader: gravityLoader(
      (id) => `collection/saved-artwork/artwork/${id}`,
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
        entityIDKeyPath: "_id",
      }
    ),
    savedArtworksLoader: gravityLoader(
      "collection/saved-artwork/artworks",
      {},
      { headers: true }
    ),
    sendConfirmationEmailLoader: gravityLoader(
      "me/confirmation_emails",
      {},
      { method: "POST" }
    ),
    sendFeedbackLoader: gravityLoader("feedback", {}, { method: "POST" }),
    showLoader: gravityLoader((id) => `show/${id}`),
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
      (id) => `me/follow/artist/${id}`,
      {},
      { method: "DELETE" }
    ),
    unfollowProfileLoader: gravityLoader(
      (id) => `me/follow/profile/${id}`,
      {},
      { method: "DELETE" }
    ),
    meUpdateCollectorProfileLoader: gravityLoader(
      "me/collector_profile",
      {},
      { method: "PUT" }
    ),
    updateCollectorProfileLoader: gravityLoader(
      (id) => `collector_profile/${id}`,
      {},
      { method: "PUT" }
    ),
    updateCollectorProfileIconLoader: gravityLoader(
      "me/collector_profile/icon",
      {},
      { method: "PUT" }
    ),
    deleteCollectorProfileIconLoader: gravityLoader(
      "me/collector_profile/icon",
      {},
      { method: "DELETE" }
    ),
    unlinkAuthenticationLoader: gravityLoader(
      (provider) => `me/authentications/${provider}`,
      {},
      { method: "DELETE" }
    ),
    updateMeLoader: gravityLoader("me", {}, { method: "PUT" }),
    updateMyPasswordLoader: gravityLoader("me/password", {}, { method: "PUT" }),
    updateUserLoader: gravityLoader(
      (id) => `user/${id}`,
      {},
      { method: "PUT" }
    ),
    usersLoader: gravityLoader("users", {}, { headers: true }),
    userInquiryRequestsLoader: gravityLoader(
      (id) => `user/${id}/artwork_inquiry_requests`,
      {},
      { headers: true }
    ),
    userSaleProfileLoader: gravityLoader((id) => `user_sale_profile/${id}`),
    userAdminNotesLoader: gravityLoader((id) => `user/${id}/admin_notes`),
    deleteUserAdminNoteLoader: gravityLoader<
      any,
      { id: string; admin_note_id: string }
    >(
      ({ id, admin_note_id }) => `user/${id}/admin_note/${admin_note_id}`,
      {},
      { method: "DELETE" }
    ),
    createUserAdminNoteLoader: gravityLoader(
      (id) => `/user/${id}/admin_note`,
      {},
      { method: "POST" }
    ),
    updateUserSaleProfileLoader: gravityLoader(
      (id) => `user_sale_profile/${id}`,
      {},
      { method: "PUT" }
    ),
    userByEmailLoader: gravityLoader("user", {}, { method: "GET" }),
    userByIDLoader: gravityLoader((id) => `user/${id}`, {}, { method: "GET" }),
    meUserInterestsLoader: gravityLoader("me/user_interests"),
    userInterestsLoader: gravityLoader(
      (id) => `user_interests?user_id=${id}`,
      {},
      { headers: true }
    ),
    userArtistFollowsLoader: gravityLoader(
      (id) => `user/${id}/follow/artists`,
      {},
      { headers: true }
    ),
    userGeneFollowsLoader: gravityLoader(
      (id) => `user/${id}/follow/genes`,
      {},
      { headers: true }
    ),
    purchasesLoader: gravityLoader("purchases", {}, { headers: true }),
    deleteUserRoleLoader: gravityLoader<any, { id: string; role_type: string }>(
      ({ id, role_type }) => `user/${id}/roles/${role_type}`,
      {},
      { method: "DELETE" }
    ),
    addUserRoleLoader: gravityLoader<any, { id: string; role_type: string }>(
      ({ id, role_type }) => `user/${id}/roles/${role_type}`,
      {},
      { method: "POST" }
    ),
    userAccessControlLoader: gravityLoader<
      any,
      { id: string; access_control_model: string }
    >(
      ({ id, access_control_model }) =>
        `user/${id}/access_controls?model=${access_control_model}`,
      {},
      { method: "GET" }
    ),
    userAccessControlLoaderAllProperties: gravityLoader<any, { id: string }>(
      (id) => `user/${id}/access_controls`,
      {},
      { headers: true }
    ),
  }
}
