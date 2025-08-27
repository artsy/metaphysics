import { gravityGraphQL } from "lib/apis/gravityGraphQL"
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"
import factories from "../api"
import { searchLoader } from "../searchLoader"

export default (accessToken, userID, opts) => {
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)
  const { gravityLoaderWithAuthenticationFactory } = factories(opts)
  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )

  return {
    addArtworkToPartnerShowLoader: gravityLoader<
      any,
      { showId: string; artworkId: string; partnerId: string }
    >(
      ({ showId, partnerId, artworkId }) =>
        `partner/${partnerId}/show/${showId}/artwork/${artworkId}`,
      {},
      { method: "POST" }
    ),
    removeArtworkFromPartnerShowLoader: gravityLoader<
      any,
      { showId: string; artworkId: string; partnerId: string }
    >(
      ({ showId, partnerId, artworkId }) =>
        `partner/${partnerId}/show/${showId}/artwork/${artworkId}`,
      {},
      { method: "DELETE" }
    ),
    repositionArtworksInPartnerShowLoader: gravityLoader<
      any,
      { showId: string; partnerId: string }
    >(
      ({ showId, partnerId }) =>
        `partner/${partnerId}/show/${showId}/reposition`,
      {},
      { method: "POST" }
    ),
    repositionInstallShotsInPartnerShowLoader: gravityLoader<
      any,
      { showId: string }
    >(
      ({ showId }) => `partner_show/${showId}/images/reposition`,
      {},
      { method: "POST" }
    ),
    repositionPartnerArtistArtworksLoader: gravityLoader<
      any,
      { artistId: string; partnerId: string }
    >(
      ({ artistId, partnerId }) =>
        `partner/${partnerId}/artist/${artistId}/partner_artist_artworks/reposition`,
      {},
      { method: "POST" }
    ),
    addInstallShotToPartnerShowLoader: gravityLoader<any, { showId: string }>(
      ({ showId }) => `partner_show/${showId}/image`,
      {},
      { method: "POST" }
    ),
    removeInstallShotFromPartnerShowLoader: gravityLoader<
      any,
      { showId: string; imageId: string }
    >(
      ({ showId, imageId }) => `partner_show/${showId}/image/${imageId}`,
      {},
      { method: "DELETE" }
    ),
    updateInstallShotLoader: gravityLoader<
      any,
      { showId: string; imageId: string }
    >(
      ({ showId, imageId }) => `partner_show/${showId}/image/${imageId}`,
      {},
      { method: "PUT" }
    ),
    addUserRoleLoader: gravityLoader<any, { id: string; role_type: string }>(
      ({ id, role_type }) => `user/${id}/roles/${role_type}`,
      {},
      { method: "POST" }
    ),
    addSetItemLoader: gravityLoader(
      (id) => `set/${id}/item`,
      {},
      { method: "POST" }
    ),
    artistDuplicatesLoader: gravityLoader(
      (id) => `artist/${id}/duplicates`,
      {},
      { headers: true }
    ),
    artworkLoader: gravityLoader((id) => `artwork/${id}`),
    artworkImportLoader: gravityLoader((id) => `artwork_import/${id}`),
    artworkImportMatchImagesLoader: gravityLoader(
      (id) => `artwork_import/${id}/match_images`,
      {},
      { method: "PUT" }
    ),
    artworkImportRemoveImageLoader: gravityLoader<
      any,
      { artworkImportID: string; rowID: string; imageID: string }
    >(
      ({ artworkImportID, rowID, imageID }) =>
        `artwork_import/${artworkImportID}/row/${rowID}/images/${imageID}`,
      {},
      { method: "DELETE" }
    ),
    artworkImportUpdateRowImagesLoader: gravityLoader<
      any,
      { artworkImportID: string; rowID: string }
    >(
      ({ artworkImportID, rowID }) =>
        `artwork_import/${artworkImportID}/row/${rowID}/images`,
      {},
      { method: "PUT" }
    ),
    artworkImportRowsLoader: gravityLoader(
      (id) => `artwork_import/${id}/rows`,
      {},
      { headers: true }
    ),
    artworkImportsLoader: gravityLoader(
      "artwork_imports",
      {},
      { headers: true }
    ),
    artworkImportSummaryLoader: gravityLoader(
      (id) => `artwork_import/${id}/summary`
    ),
    artworkImportUnmatchedArtistNamesLoader: gravityLoader(
      (id) => `artwork_import/${id}/unmatched_artist_names`
    ),
    artworkImportUpdateLoader: gravityLoader(
      (id) => `artwork_import/${id}`,
      {},
      { method: "PUT" }
    ),
    artworkImportUpdateRowLoader: gravityLoader<
      any,
      { artworkImportID: string; rowID: string }
    >(
      ({ artworkImportID, rowID }) =>
        `artwork_import/${artworkImportID}/rows/${rowID}`,
      {},
      { method: "PUT" }
    ),
    artworkImportCreateArtworksLoader: gravityLoader(
      (id) => `artwork_import/${id}/artworks`,
      {},
      { method: "POST" }
    ),
    artworkImportCreateArtistMatchLoader: gravityLoader(
      (id) => `artwork_import/${id}/artist_matches`,
      {},
      { method: "POST" }
    ),
    artworkImportCreateArtistAssignmentLoader: gravityLoader(
      (id) => `artwork_import/${id}/artist_assignments`,
      {},
      { method: "POST" }
    ),
    artworkImportCreateImageMatchLoader: gravityLoader(
      (id) => `artwork_import/${id}/image_matches`,
      {},
      { method: "POST" }
    ),
    artworkImportCreateCellFlagLoader: gravityLoader(
      (id) => `artwork_import/${id}/cell_flags`,
      {},
      { method: "POST" }
    ),
    // End RESTful Artwork Import Loaders
    artworksCollectionsBatchUpdateLoader: gravityLoader(
      "artworks/collections/batch",
      {},
      { method: "POST" }
    ),
    artworksDiscoveryLoader: gravityLoader("artworks_discovery"),
    artistLoader: gravityLoader((id) => `artist/${id}`),
    authenticatedArtworkVersionLoader: gravityLoader(
      (id) => `artwork_version/${id}`
    ),
    authenticationsLoader: gravityLoader(
      "me/authentications",
      {},
      { headers: true }
    ),
    bankAccountLoader: gravityLoader((id) => `bank_account/${id}`),
    collectionArtistsLoader: gravityLoader(
      (id) => `collection/${id}/artists`,
      { user_id: userID },
      { headers: true }
    ),
    collectionArtworksLoader: gravityLoader(
      (id) => `collection/${id}/artworks`,
      { user_id: userID },
      { headers: true }
    ),
    collectionLoader: gravityLoader((id) => `collection/${id}`, {
      user_id: userID,
    }),
    collectionsLoader: gravityLoader("collections", {}, { headers: true }),
    collectorProfilesLoader: gravityLoader(
      "collector_profiles",
      {},
      { headers: true }
    ),
    collectorProfileSummaryLoader: gravityLoader("collector_profile_summary"),
    createAccountRequestLoader: gravityLoader(
      "account_requests",
      {},
      { method: "POST" }
    ),
    createArtistLoader: gravityLoader("artist", {}, { method: "POST" }),
    createArtistCareerHighlightLoader: gravityLoader(
      "artist_career_highlight",
      {},
      { method: "POST" }
    ),
    createArtworkImportLoader: gravityLoader(
      "artwork_import",
      {},
      { method: "POST" }
    ),
    addImageToArtworkLoader: gravityLoader(
      (id) => `artwork/${id}/image`,
      {},
      { method: "POST" }
    ),
    createCommerceOptInEligibleArtworksReportLoader: gravityLoader(
      (id) => `partner/${id}/commerce_opt_in_eligible_artworks_report`,
      {},
      { method: "POST" }
    ),
    createAndSendBackupSecondFactorLoader: gravityLoader(
      (userID) => `user/${userID}/backup_code`,
      {},
      { method: "POST" }
    ),
    createSecondFactorLoader: gravityLoader(
      "me/second_factors",
      {},
      { method: "POST" }
    ),
    createUserSeenArtworkLoader: gravityLoader(
      "artworks_discovery/artworks/seen",
      {},
      { method: "POST" }
    ),
    excludeArtistFromDiscoveryLoader: gravityLoader(
      "artworks_discovery/artists/exclude",
      {},
      { method: "POST" }
    ),
    deliverSecondFactor: gravityLoader(
      (id) => `me/second_factors/${id}/deliver`,
      {},
      { method: "PUT" }
    ),
    disableSecondFactorLoader: gravityLoader(
      (id) => `me/second_factors/${id}`,
      {},
      { method: "DELETE" }
    ),
    enableSecondFactorLoader: gravityLoader(
      (id) => `me/second_factors/${id}/enable`,
      {},
      { method: "PUT" }
    ),
    updateSecondFactorLoader: gravityLoader(
      (id) => `me/second_factors/${id}`,
      {},
      { method: "PUT" }
    ),
    updateArtistCareerHighlightLoader: gravityLoader(
      (id) => `artist_career_highlight/${id}`,
      {},
      { method: "PUT" }
    ),
    devicesLoader: gravityLoader("devices", {}, { headers: true }),
    deleteArtistCareerHighlightLoader: gravityLoader(
      (id) => `artist_career_highlight/${id}`,
      {},
      { method: "DELETE" }
    ),
    createVerifiedRepresentativeLoader: gravityLoader(
      "verified_representatives",
      {},
      { method: "POST" }
    ),
    createViewingRoomLoader: gravityLoader(
      "viewing_room",
      {},
      { method: "POST" }
    ),
    deleteVerifiedRepresetativeLoader: gravityLoader(
      (id) => `verified_representatives/${id}`,
      {},
      { method: "DELETE" }
    ),
    createArtworkLoader: gravityLoader("artwork", {}, { method: "POST" }),
    createArtworkEditionSetLoader: gravityLoader(
      (artworkID) => `artwork/${artworkID}/edition_set`,
      {},
      { method: "POST" }
    ),
    createArtworkImageLoader: gravityLoader(
      (id) => `artwork/${id}/image`,
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
    createCollectionLoader: gravityLoader("collection", {}, { method: "POST" }),
    createIdentityVerificationOverrideLoader: gravityLoader(
      (id) => `identity_verification/${id}/override`,
      {},
      { method: "POST" }
    ),
    createPartnerArtistLoader: gravityLoader<
      any,
      { partnerID: string; artistID: string }
    >(
      ({ partnerID, artistID }) => `partner/${partnerID}/artist/${artistID}`,
      {},
      { method: "PUT" } // Intentional PUT even though this is a create operation
    ),
    createPartnerContactLoader: gravityLoader(
      (id) => `partner/${id}/contact`,
      {},
      { method: "POST" }
    ),
    createPartnerLocationLoader: gravityLoader(
      (id) => `partner/${id}/location`,
      {},
      { method: "POST" }
    ),
    createPartnerLocationDaySchedulesLoader: gravityLoader<
      any,
      { partnerId: string; locationId: string }
    >(
      ({ partnerId, locationId }) =>
        `partner/${partnerId}/location/${locationId}/day_schedules`,
      {},
      { method: "POST" }
    ),
    createPartnerOfferLoader: gravityLoader(
      "partner_offer",
      {},
      { method: "POST" }
    ),
    createPartnerShowLoader: gravityLoader(
      (partnerID) => `partner/${partnerID}/show`,
      {},
      { method: "POST" }
    ),
    createPartnerArtistDocumentLoader: gravityLoader<
      any,
      { partnerID: string; artistID: string }
    >(
      ({ partnerID, artistID }) =>
        `partner/${partnerID}/artist/${artistID}/document`,
      {},
      { method: "POST" }
    ),
    createPartnerShowDocumentLoader: gravityLoader<
      any,
      { partnerID: string; showID: string }
    >(
      ({ partnerID, showID }) => `partner/${partnerID}/show/${showID}/document`,
      {},
      { method: "POST" }
    ),
    createPartnerShowEventLoader: gravityLoader<
      any,
      { partnerID: string; showID: string }
    >(
      ({ partnerID, showID }) => `partner/${partnerID}/show/${showID}/event`,
      {},
      { method: "POST" }
    ),
    createSaleAgreementLoader: gravityLoader(
      "sale_agreements",
      {},
      { method: "POST" }
    ),
    createSetLoader: gravityLoader("set", {}, { method: "POST" }),
    createUserAdminNoteLoader: gravityLoader(
      (id) => `/user/${id}/admin_note`,
      {},
      { method: "POST" }
    ),
    createUserInterestLoader: gravityLoader(
      "user_interest",
      {},
      { method: "POST" }
    ),
    createUserSaleProfileLoader: gravityLoader(
      `user_sale_profile`,
      {},
      { method: "POST" }
    ),
    creditCardLoader: gravityLoader((id) => `credit_card/${id}`),
    deleteArtistLoader: gravityLoader(
      (id) => `artist/${id}`,
      {},
      { method: "DELETE" }
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
    deleteArtworkImageLoader: gravityLoader<
      any,
      { artworkID: string; imageID: string }
    >(
      ({ artworkID, imageID }) => `artwork/${artworkID}/image/${imageID}`,
      {},
      { method: "DELETE" }
    ),
    deleteArtworkLoader: gravityLoader(
      (id) => `artwork/${id}`,
      {},
      { method: "DELETE" }
    ),
    deleteBankAccountLoader: gravityLoader(
      (id) => `me/bank_account/${id}`,
      {},
      { method: "DELETE" }
    ),
    deleteCollectionLoader: gravityLoader(
      (id) => `collection/${id}`,
      { user_id: userID },
      { method: "DELETE" }
    ),
    deleteCollectorProfileIconLoader: gravityLoader(
      "me/collector_profile/icon",
      {},
      { method: "DELETE" }
    ),
    deleteCreditCardLoader: gravityLoader(
      (id) => `me/credit_card/${id}`,
      {},
      { method: "DELETE" }
    ),
    deleteDislikedArtworkLoader: gravityLoader(
      (id) => `collection/disliked-artwork/artwork/${id}`,
      {},
      { method: "DELETE" }
    ),
    deletePartnerContactLoader: gravityLoader<
      any,
      { partnerId: string; contactId: string }
    >(
      ({ partnerId, contactId }) => `partner/${partnerId}/contact/${contactId}`,
      {},
      { method: "DELETE" }
    ),
    deletePartnerLocationLoader: gravityLoader<
      any,
      { partnerId: string; locationId: string }
    >(
      ({ partnerId, locationId }) =>
        `partner/${partnerId}/location/${locationId}`,
      {},
      { method: "DELETE" }
    ),
    deletePartnerShowLoader: gravityLoader<
      any,
      { partnerID: string; showID: string }
    >(
      ({ partnerID, showID }) => `partner/${partnerID}/show/${showID}`,
      {},
      { method: "DELETE" }
    ),
    deletePartnerArtistDocumentLoader: gravityLoader<
      any,
      { partnerID: string; artistID: string; documentId: string }
    >(
      ({ partnerID, artistID, documentId }) =>
        `partner/${partnerID}/artist/${artistID}/document/${documentId}`,
      {},
      { method: "DELETE" }
    ),
    deletePartnerShowDocumentLoader: gravityLoader<
      any,
      { partnerID: string; showID: string; documentId: string }
    >(
      ({ partnerID, showID, documentId }) =>
        `partner/${partnerID}/show/${showID}/document/${documentId}`,
      {},
      { method: "DELETE" }
    ),
    deletePartnerShowEventLoader: gravityLoader<
      any,
      { partnerID: string; showID: string; eventID: string }
    >(
      ({ partnerID, showID, eventID }) =>
        `partner/${partnerID}/show/${showID}/event/${eventID}`,
      {},
      { method: "DELETE" }
    ),
    deleteSavedArtworkLoader: gravityLoader(
      (id) => `collection/saved-artwork/artwork/${id}`,
      {},
      { method: "DELETE" }
    ),
    deleteSetLoader: gravityLoader(
      (id) => `set/${id}`,
      {},
      { method: "DELETE" }
    ),
    createHeroUnitLoader: gravityLoader("hero_units", {}, { method: "POST" }),
    updateHeroUnitLoader: gravityLoader(
      (id) => `hero_units/${id}`,
      {},
      { method: "PUT" }
    ),
    updateViewingRoomLoader: gravityLoader(
      (id) => `viewing_room/${id}`,
      {},
      { method: "PUT" }
    ),
    updateViewingRoomArtworksLoader: gravityLoader(
      (id) => `viewing_room/${id}/viewing_room_artworks`,
      {},
      { method: "PUT" }
    ),
    updateViewingRoomSubsectionsLoader: gravityLoader(
      (id) => `viewing_room/${id}/subsections`,
      {},
      { method: "PUT" }
    ),
    deleteHeroUnitLoader: gravityLoader(
      (id) => `hero_units/${id}`,
      {},
      { method: "DELETE" }
    ),
    deleteSetItemLoader: gravityLoader<any, { id: string; itemId: string }>(
      ({ id, itemId }) => `set/${id}/item/${itemId}`,
      {},
      { method: "DELETE" }
    ),
    deleteUserLoader: gravityLoader(
      (id) => `user/${id}`,
      {},
      { method: "DELETE" }
    ),
    deleteUserAdminNoteLoader: gravityLoader<
      any,
      { id: string; admin_note_id: string }
    >(
      ({ id, admin_note_id }) => `user/${id}/admin_note/${admin_note_id}`,
      {},
      { method: "DELETE" }
    ),
    deleteUserInterestLoader: gravityLoader(
      (id) => `user_interest/${id}`,
      {},
      { method: "DELETE" }
    ),
    deleteUserRoleLoader: gravityLoader<any, { id: string; role_type: string }>(
      ({ id, role_type }) => `user/${id}/roles/${role_type}`,
      {},
      { method: "DELETE" }
    ),
    deleteViewingRoomLoader: gravityLoader(
      (id) => `viewing_room/${id}`,
      {},
      { method: "DELETE" }
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
    endSaleLoader: gravityLoader(
      (id) => `sale/${id}/end_sale`,
      {},
      { method: "PUT" }
    ),
    featuredLinkLoader: gravityLoader((id) => `featured_link/${id}`),
    featuredLinksLoader: gravityLoader("featured_links", {}, { headers: true }),
    createFeaturedLinkLoader: gravityLoader(
      "featured_link",
      {},
      { method: "POST" }
    ),
    deleteFeaturedLinkLoader: gravityLoader(
      (id) => `featured_link/${id}`,
      {},
      { method: "DELETE" }
    ),
    updateFeaturedLinkLoader: gravityLoader(
      (id) => `featured_link/${id}`,
      {},
      { method: "PUT" }
    ),
    matchFeaturedLinksLoader: gravityLoader(
      "match/featured_links",
      {},
      { headers: true }
    ),
    featureLoader: gravityLoader((id) => `feature/${id}`),
    featuresLoader: gravityLoader("features", {}, { headers: true }),
    createFeatureLoader: gravityLoader("feature", {}, { method: "POST" }),
    deleteFeatureLoader: gravityLoader(
      (id) => `feature/${id}`,
      {},
      { method: "DELETE" }
    ),
    updateFeatureLoader: gravityLoader(
      (id) => `feature/${id}`,
      {},
      { method: "PUT" }
    ),
    matchFeaturesLoader: gravityLoader("match/features", {}, { headers: true }),
    filterArtworksLoader: gravityLoader("filter/artworks"),
    followArtistLoader: gravityLoader(
      "me/follow/artist",
      {},
      { method: "POST" }
    ),
    followGeneLoader: gravityLoader("me/follow/gene", {}, { method: "POST" }),
    followProfileLoader: gravityLoader(
      "me/follow/profile",
      {},
      { method: "POST" }
    ),
    followShowLoader: gravityLoader("follow_shows", {}, { method: "POST" }),
    followedArtistLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/artists"),
      {
        paramKey: "artists",
        trackingKey: "is_followed",
        entityKeyPath: "artist",
      }
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
    followedArtistsShowsLoader: gravityLoader(
      "me/follow/artists/shows",
      {},
      { headers: true }
    ),
    followedGeneLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/genes"),
      {
        paramKey: "genes",
        trackingKey: "is_followed",
        entityKeyPath: "gene",
      }
    ),
    followedFairsLoader: gravityLoader(
      "/me/follow/profiles",
      {},
      { headers: true }
    ),
    followedGenesLoader: gravityLoader<
      { gene: { id: string; name: string } }[]
    >("me/follow/genes", {}, { headers: true }),
    followedPartnersLoader: gravityLoader(
      "/me/follow/profiles",
      {},
      { headers: true }
    ),
    followedProfileLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/profiles"),
      {
        paramKey: "profiles",
        trackingKey: "is_followed",
        entityKeyPath: "profile",
      }
    ),
    followedProfilesArtworksLoader: gravityLoader(
      "me/follow/profiles/artworks",
      {},
      { headers: true }
    ),
    followedShowLoader: trackedEntityLoaderFactory(
      gravityLoader("follow_shows"),
      {
        paramKey: "show_ids",
        trackingKey: "is_followed",
        entityKeyPath: "partner_show",
        entityIDKeyPath: "_id",
      }
    ),
    followedShowsLoader: gravityLoader("follow_shows", {}, { headers: true }),
    gravityGraphQLLoader: gravityGraphQL(accessToken),
    homepageModulesLoader: gravityLoader("me/modules"),
    // DEPRECATED: This endpoint is no longer in use.
    homepageSuggestedArtworksLoader: gravityLoader(
      "me/suggested/artworks/homepage"
    ),

    identityVerificationOverridesLoader: gravityLoader(
      (id) => `identity_verification/${id}/overrides`
    ),

    identityVerificationScanReferencesLoader: gravityLoader(
      (id) => `identity_verification/${id}/scan_references`
    ),
    identityVerificationsLoader: gravityLoader(
      "identity_verifications",
      {},
      { headers: true }
    ),
    internalSearchLoader: searchLoader(gravityLoader),
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
    linkAuthenticationLoader: gravityLoader(
      (provider) => `me/authentications/${provider}`,
      {},
      { method: "POST" }
    ),
    lotStandingLoader: gravityLoader("me/lot_standings", { size: 100 }),
    markNotificationsAsSeenLoader: gravityLoader(
      "me/notifications/mark_as_seen",
      {},
      { method: "PUT" }
    ),
    authenticatedHeroUnitsLoader: gravityLoader(
      "hero_units",
      {},
      { headers: true }
    ),
    authenticatedHeroUnitLoader: gravityLoader(
      (id) => `hero_units/${id}`,
      {},
      { headers: true }
    ),
    matchHeroUnitsLoader: gravityLoader(
      "match/hero_units",
      {},
      { headers: true }
    ),
    matchPartnerLoader: gravityLoader<any, { term: string }>(
      ({ term }) => `/match/partners?term=${term}&size=10`
    ),
    matchProfilesLoader: gravityLoader("match/profiles", {}, { headers: true }),
    matchSalesLoader: gravityLoader("match/sales", {}, { headers: true }),
    matchSetsLoader: gravityLoader("match/sets", {}, { headers: true }),
    matchShowsLoader: gravityLoader(
      "match/partner_shows",
      {},
      { headers: true }
    ),
    matchFairsLoader: gravityLoader("match/fairs", {}, { headers: true }),
    matchUsersLoader: gravityLoader("match/users", {}, { headers: true }),
    mergeArtistLoader: gravityLoader("artists/merge", {}, { method: "POST" }),
    meAlertLoader: gravityLoader((id) => `me/alert/${id}`),
    meAlertsLoader: gravityLoader("me/alerts", {}, { headers: true }),
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
    meUpdateCollectionsLoader: gravityLoader(
      "me/collections",
      {},
      { method: "PUT" }
    ),
    meCollectorProfileLoader: gravityLoader("me/collector_profile"),
    meCreateAlertLoader: gravityLoader("me/alert", {}, { method: "POST" }),
    meCreateUserInterestLoader: gravityLoader(
      "me/user_interest",
      {},
      { method: "POST" }
    ),
    meCreditCardsLoader: gravityLoader(
      "me/credit_cards",
      {},
      { headers: true }
    ),
    meDeleteAlertLoader: gravityLoader(
      (id) => `me/alert/${id}`,
      {},
      { method: "DELETE" }
    ),
    meDeleteUserAccountLoader: gravityLoader("me", {}, { method: "DELETE" }),
    meDeleteUserInterestLoader: gravityLoader(
      (id) => `me/user_interest/${id}`,
      {},
      { method: "DELETE" }
    ),
    meUpdateAlertLoader: gravityLoader(
      (id) => `me/alert/${id}`,
      {},
      { method: "PUT" }
    ),
    meUpdateUserInterestLoader: gravityLoader(
      (id) => `me/user_interest/${id}`,
      {},
      { method: "PUT" }
    ),
    meNotificationLoader: gravityLoader((id) => `me/notifications/${id}`),
    meLoader: gravityLoader("me"),
    mePartnersLoader: gravityLoader("me/partners"),
    mePartnerOfferLoader: gravityLoader((id) => `me/partner_offer/${id}`),
    mePartnerOffersLoader: gravityLoader(
      `me/partner_offers`,
      {},
      { headers: true }
    ),
    mePingLoader: gravityLoader("me/ping"),
    meTasksLoader: gravityLoader("me/tasks", {}, { headers: true }),
    meDismissTaskLoader: gravityLoader(
      (id) => `me/task/${id}/dismiss`,
      {},
      { method: "PUT" }
    ),
    meAckTaskLoader: gravityLoader(
      (id) => `me/task/${id}/acknowledge`,
      {},
      { method: "PUT" }
    ),
    meUpdateCollectorProfileLoader: gravityLoader(
      "me/collector_profile",
      {},
      { method: "PUT" }
    ),
    meUserInterestLoader: gravityLoader((id) => `me/user_interest/${id}`),
    meUserInterestsLoader: gravityLoader(
      "me/user_interests",
      {},
      { headers: true }
    ),
    meUserAddressesLoader: gravityLoader(
      "me/user_addresses",
      {},
      { headers: true }
    ),
    meUserAddressLoader: gravityLoader(
      (id) => `me/user_address/${id}`,
      {},
      { headers: true }
    ),
    meCreateUserAddressLoader: gravityLoader(
      "me/user_addresses",
      {},
      { method: "POST" }
    ),
    meUpdateUserAddressLoader: gravityLoader(
      (id) => `me/user_address/${id}`,
      {},
      { method: "PUT" }
    ),
    meDeleteUserAddressLoader: gravityLoader(
      (id) => `me/user_address/${id}`,
      {},
      { method: "DELETE" }
    ),
    meUpdateUserDefaultAddressLoader: gravityLoader(
      (id) => `me/user_address/${id}/set_default`,
      {},
      { method: "PUT" }
    ),
    meMyCollectionArtworksLoader: gravityLoader(
      "me/my_collection_artworks",
      {},
      { headers: true }
    ),

    meSearchCriteriaLoader: gravityLoader((id) => `me/search_criteria/${id}`),
    meShowsLoader: gravityLoader("me/shows", {}, { headers: true }),
    myCollectionArtworksLoader: gravityLoader(
      "collection/my-collection/artworks",
      {},
      { headers: true }
    ),
    notificationPreferencesLoader: gravityLoader("notification_preferences"),
    notificationsFeedLoader: gravityLoader("me/notifications/feed"),
    pageLoader: gravityLoader((id) => `page/${id}`),
    pagesLoader: gravityLoader("pages", {}, { headers: true }),
    createPageLoader: gravityLoader("page", {}, { method: "POST" }),
    createPurchaseLoader: gravityLoader("purchase", {}, { method: "POST" }),
    deletePageLoader: gravityLoader(
      (id) => `page/${id}`,
      {},
      { method: "DELETE" }
    ),
    deletePurchaseLoader: gravityLoader(
      (id) => `purchase/${id}`,
      {},
      { method: "DELETE" }
    ),
    updatePageLoader: gravityLoader(
      (id) => `page/${id}`,
      {},
      { method: "PUT" }
    ),
    updatePurchaseLoader: gravityLoader(
      (id) => `purchase/${id}`,
      {},
      { method: "PUT" }
    ),
    matchPagesLoader: gravityLoader("match/pages", {}, { headers: true }),
    optInArtworksIntoCommerceLoader: gravityLoader(
      (id) => `partner/${id}/bulk_operations/commerce_opt_in`,
      {},
      { method: "PUT" }
    ),
    partnerArtistsWithAlertCountsLoader: gravityLoader(
      (id) => `partner/${id}/artists_with_alert_counts`,
      {},
      { headers: true }
    ),
    partnerLoader: gravityLoader((id) => `partner/${id}`),
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
    partnerArtistsAllLoader: gravityLoader(
      (id) => `partner/${id}/partner_artists/all`,
      {},
      { headers: true }
    ),
    partnerArtworksAllLoader: gravityLoader(
      (id) => `partner/${id}/artworks/all`,
      {},
      { headers: true }
    ),
    partnerArtworksLoader: gravityLoader(
      (id) => `partner/${id}/artworks`,
      {},
      { headers: true }
    ),
    partnerArtworkOfferableActivityLoader: gravityLoader<
      any,
      { id: string; artworkId: string }
    >(
      ({ id, artworkId }) =>
        `partner/${id}/artworks/${artworkId}/offerable_activity`,
      {},
      { headers: true }
    ),
    partnerDocumentsLoader: gravityLoader<any, { id: string }>(
      (id) => `partner/${id}/documents`,
      {},
      { headers: true }
    ),
    partnerMerchantAccountsLoader: gravityLoader<any, { partnerId: string }>(
      ({ partnerId }) => `merchant_accounts?partner_id=${partnerId}`,
      {},
      { headers: true }
    ),
    partnerCollectorProfileLoader: gravityLoader<any, { partnerId; userId }>(
      ({ partnerId, userId }) =>
        `partner_collector_profile?partner_id=${partnerId}&user_id=${userId}`
    ),
    partnerCollectorProfilesLoader: gravityLoader(
      "partner_collector_profiles",
      {},
      { headers: true }
    ),
    partnerCollectorProfileArtworkInquiryCountLoader: gravityLoader<
      any,
      { partnerID: string; collectorProfileID: string }
    >(
      ({ partnerID, collectorProfileID }) =>
        `partner_collector_profile/${collectorProfileID}/artwork_inquiry_requests_count?partner_id=${partnerID}`
    ),
    partnerCollectorProfileEngagementLoader: gravityLoader<
      any,
      { partnerID: string; collectorProfileID: string }
    >(
      ({ partnerID, collectorProfileID }) =>
        `partner_collector_profile/${collectorProfileID}/partner_engagement?partner_id=${partnerID}`
    ),
    partnerCollectorProfileUserInterestsLoader: gravityLoader<
      any,
      { collectorProfileId: string; partnerId: string }
    >(
      ({ collectorProfileId, partnerId }) =>
        `partner_collector_profile/${collectorProfileId}/user_interests?partner_id=${partnerId}`,
      {},
      { headers: true }
    ),
    partnerContactLoader: gravityLoader<
      any,
      { partnerId: string; contactId: string }
    >(
      ({ partnerId, contactId }) => `partner/${partnerId}/contact/${contactId}`
    ),
    partnerContactsLoader: gravityLoader(
      (id) => `partner/${id}/contacts`,
      {},
      { headers: true }
    ),
    partnerInquiryRequestLoader: gravityLoader<
      any,
      { partnerId: string; inquiryId: string }
    >(
      ({ partnerId, inquiryId }) =>
        `partner/${partnerId}/inquiry_request/${inquiryId}`
    ),
    partnerLocationLoader: gravityLoader<
      any,
      { partnerId: string; locationId: string }
    >(
      ({ partnerId, locationId }) =>
        `partner/${partnerId}/location/${locationId}`
    ),
    partnerLocationsConnectionLoader: gravityLoader(
      (id) => `partner/${id}/locations`,
      {},
      { headers: true }
    ),
    profileLoader: gravityLoader((id) => `profile/${id}`),
    repositionPartnerLocationsLoader: gravityLoader(
      (id) => `partner/${id}/locations/reposition`,
      {},
      { method: "POST" }
    ),
    partnerOffersLoader: gravityLoader("partner_offers", {}, { headers: true }),
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
    partnerSearchShowsLoader: gravityLoader(
      (id) => `/match/partner/${id}/shows`,
      {},
      { headers: true }
    ),
    partnerSearchCriteriasLoader: gravityLoader(
      (id) => `/partner/${id}/partner_search_criterias`,
      {},
      { headers: true }
    ),
    partnerSearchCriteriaLoader: gravityLoader<
      any,
      { partner_id: string; id: string }
    >(
      ({ partner_id, id }) =>
        `/partner/${partner_id}/partner_search_criteria/${id}`,
      {},
      { headers: true }
    ),
    partnerSearchCriteriaHitsLoader: gravityLoader(
      (id) => `partner/${id}/partner_search_criteria_hits`,
      {},
      { headers: true }
    ),
    partnerShowsLoader: gravityLoader(
      (partner_id) => `partner/${partner_id}/shows`,
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
    partnerShowImagesLoader: gravityLoader(
      (id) => `partner_show/${id}/images`,
      {},
      { headers: true }
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
    partnersLoader: gravityLoader("partners", {}, { headers: true }),
    popularArtistsLoader: gravityLoader("artists/popular"),
    profilesLoader: gravityLoader("profiles", {}, { headers: true }),
    purchaseLoader: gravityLoader((id) => `purchase/${id}`),
    purchasesLoader: gravityLoader("purchases", {}, { headers: true }),
    recordArtworkViewLoader: gravityLoader(
      "me/Recently_viewed_artworks",
      {},
      { method: "POST" }
    ),
    userRolesLoader: gravityLoader("system/roles"),
    saleAgreementsLoader: gravityLoader(
      "sale_agreements",
      {},
      { headers: true }
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
    saleAgreementLoader: gravityLoader((id) => `sale_agreements/${id}`),
    saleSaleAgreementLoader: gravityLoader((id) => `sale/${id}/sale_agreement`),
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
        batchSize: 10,
      }
    ),
    savedArtworksLoader: gravityLoader(
      "collection/saved-artwork/artworks",
      {},
      { headers: true }
    ),
    secondFactorsLoader: gravityLoader("me/second_factors"),
    sendConfirmationEmailLoader: gravityLoader(
      "me/confirmation_emails",
      {},
      { method: "POST" }
    ),
    sendFeedbackLoader: gravityLoader("feedback", {}, { method: "POST" }),
    sendIdentityVerificationEmailLoader: gravityLoader(
      `identity_verification`,
      {},
      { method: "POST" }
    ),
    setLoader: gravityLoader((id) => `set/${id}`),
    setItemsLoader: gravityLoader(
      (id) => `set/${id}/items`,
      {},
      { headers: true }
    ),
    setsLoader: gravityLoader("sets", {}, { headers: true }),
    showLoader: gravityLoader((id) => `show/${id}`),
    partnerShowLoader: gravityLoader<
      any,
      { partner_id: string; show_id: string }
    >(({ partner_id, show_id }) => `partner/${partner_id}/show/${show_id}`),
    submitArtworkInquiryRequestLoader: gravityLoader(
      "me/artwork_inquiry_request",
      {},
      { method: "POST" }
    ),
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
    triggerCampaignLoader: gravityLoader(
      "me/trigger_campaign",
      {},
      { method: "POST" }
    ),
    unfollowArtistLoader: gravityLoader(
      (id) => `me/follow/artist/${id}`,
      {},
      { method: "DELETE" }
    ),
    unfollowGeneLoader: gravityLoader(
      (geneID) => `me/follow/gene/${geneID}`,
      {},
      { method: "DELETE" }
    ),
    unfollowProfileLoader: gravityLoader(
      (id) => `me/follow/profile/${id}`,
      {},
      { method: "DELETE" }
    ),
    unfollowShowLoader: gravityLoader("follow_shows", {}, { method: "DELETE" }),
    unlinkAuthenticationLoader: gravityLoader(
      (provider) => `me/authentications/${provider}`,
      {},
      { method: "DELETE" }
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
    updateArtworkLoader: gravityLoader(
      (id) => `artwork/${id}`,
      {},
      { method: "PUT" }
    ),
    updateCollectionLoader: gravityLoader(
      (id) => `collection/${id}`,
      {},
      { method: "PUT" }
    ),
    updateCollectorProfileIconLoader: gravityLoader(
      "me/collector_profile/icon",
      {},
      { method: "PUT" }
    ),
    updateCollectorProfileLoader: gravityLoader(
      (id) => `collector_profile/${id}`,
      {},
      { method: "PUT" }
    ),
    updateMeLoader: gravityLoader("me", {}, { method: "PUT" }),
    updateMyPasswordLoader: gravityLoader("me/password", {}, { method: "PUT" }),
    updateNotificationPreferencesLoader: gravityLoader(
      "notification_preferences",
      {},
      { method: "POST" }
    ),
    updateNotificationsLoader: gravityLoader(
      "me/notifications",
      {},
      { method: "PUT" }
    ),
    artsyShippingOptInLoader: gravityLoader(
      (id) => `partner/${id}/bulk_operations/artsy_shipping_opt_in`,
      {},
      { method: "PUT" }
    ),
    updatePartnerArtworksMetadataLoader: gravityLoader(
      (id) => `partner/${id}/bulk_operations/update_metadata`,
      {},
      { method: "PUT" }
    ),
    addArtworksToShowLoader: gravityLoader(
      (id) => `partner/${id}/bulk_operations/add_artworks_to_show`,
      {},
      { method: "PUT" }
    ),
    updatePartnerContactLoader: gravityLoader<
      any,
      { partnerId: string; contactId: string }
    >(
      ({ partnerId, contactId }) => `partner/${partnerId}/contact/${contactId}`,
      {},
      { method: "PUT" }
    ),
    updatePartnerLocationLoader: gravityLoader<
      any,
      { partnerId: string; locationId: string }
    >(
      ({ partnerId, locationId }) =>
        `partner/${partnerId}/location/${locationId}`,
      {},
      { method: "PUT" }
    ),
    updatePartnerShowLoader: gravityLoader<
      any,
      { partnerId: string; showId: string }
    >(
      ({ partnerId, showId }) => `partner/${partnerId}/show/${showId}`,
      {},
      { method: "PUT" }
    ),
    updatePartnerProfileImageLoader: gravityLoader(
      (id) => `partner/${id}/profile_images`,
      {},
      { method: "POST" } // intentional POST
    ),
    deletePartnerArtistLoader: gravityLoader<
      any,
      { partnerId: string; artistId: string }
    >(
      ({ partnerId, artistId }) =>
        `partner/${partnerId}/artist/${artistId}?delete_artworks=true`,
      {},
      { method: "DELETE" }
    ),
    updatePartnerArtistLoader: gravityLoader(
      (id) => `partner_artist/${id}`,
      {},
      { method: "PUT" }
    ),
    updatePartnerArtistDocumentLoader: gravityLoader<
      any,
      { partnerId: string; artistId: string; documentId: string }
    >(
      ({ partnerId, artistId, documentId }) =>
        `partner/${partnerId}/artist/${artistId}/document/${documentId}`,
      {},
      { method: "PUT" }
    ),
    updatePartnerShowDocumentLoader: gravityLoader<
      any,
      { partnerId: string; showId: string; documentId: string }
    >(
      ({ partnerId, showId, documentId }) =>
        `partner/${partnerId}/show/${showId}/document/${documentId}`,
      {},
      { method: "PUT" }
    ),
    updatePartnerShowEventLoader: gravityLoader<
      any,
      { partnerId: string; showId: string; eventId: string }
    >(
      ({ partnerId, showId, eventId }) =>
        `partner/${partnerId}/show/${showId}/event/${eventId}`,
      {},
      { method: "PUT" }
    ),
    updatePartnerFlagsLoader: gravityLoader(
      (id) => `partner/${id}/partner_flags`,
      {},
      { method: "PUT" }
    ),
    updatePartnerLoader: gravityLoader(
      (id) => `partner/${id}`,
      {},
      { method: "PUT" }
    ),
    updateProfileLoader: gravityLoader(
      (id) => `profile/${id}`,
      {},
      { method: "PUT" }
    ),
    updateSaleAgreementLoader: gravityLoader(
      (id) => `sale_agreements/${id}`,
      {},
      { method: "PUT" }
    ),
    updateSetLoader: gravityLoader((id) => `set/${id}`, {}, { method: "PUT" }),
    updateUserLoader: gravityLoader(
      (id) => `user/${id}`,
      {},
      { method: "PUT" }
    ),
    updateUserSaleProfileLoader: gravityLoader(
      (id) => `user_sale_profile/${id}`,
      {},
      { method: "PUT" }
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
    userAdminNotesLoader: gravityLoader((id) => `user/${id}/admin_notes`),
    userArtistFollowsLoader: gravityLoader(
      (id) => `user/${id}/follow/artists`,
      {},
      { headers: true }
    ),
    userByEmailLoader: gravityLoader("user", {}, { method: "GET" }),
    userByIDLoader: gravityLoader((id) => `user/${id}`, {}, { method: "GET" }),
    userGeneFollowsLoader: gravityLoader(
      (id) => `user/${id}/follow/genes`,
      {},
      { headers: true }
    ),
    userInquiryRequestsLoader: gravityLoader(
      (id) => `user/${id}/artwork_inquiry_requests`,
      {},
      { headers: true }
    ),
    userInterestsLoader: gravityLoader(
      (id) => `user_interests?user_id=${id}`,
      {},
      { headers: true }
    ),
    userSaleProfileLoader: gravityLoader((id) => `user_sale_profile/${id}`),
    usersLoader: gravityLoader("users", {}, { headers: true }),
    quizLoader: gravityLoader(`user_art_quiz`, {}, { method: "GET" }),
    updateQuizLoader: gravityLoader(`user_art_quiz`, {}, { method: "PUT" }),
    updateArtistLoader: gravityLoader(
      (id) => `artist/${id}`,
      {},
      { method: "PUT" }
    ),
    verifyAddressLoader: gravityLoader(
      "address_verification",
      {},
      { method: "POST" }
    ),
    viewingRoomLoader: gravityLoader((id) => `viewing_room/${id}`),
    viewingRoomSubsectionsLoader: gravityLoader(
      (id) => `viewing_room/${id}/subsections`
    ),
    viewingRoomArtworksLoader: gravityLoader(
      (id) => `viewing_room/${id}/viewing_room_artworks`
    ),
    viewingRoomsLoader: gravityLoader("viewing_rooms", {}, { headers: true }),
  }
}
