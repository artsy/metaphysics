import { Gravity } from "types/runtime"
import factories from "../api"
import { uncachedLoaderFactory } from "lib/loaders/api/loader_without_cache_factory"
import gravity from "lib/apis/gravity"
import { createBatchLoaders } from "../batchLoader"
import { searchLoader } from "../searchLoader"
import { createBatchSaleArtworkLoader } from "../batchSaleArtworkLoader"
import config from "config"

export type StartIdentityVerificationGravityOutput = {
  identity_verification_id: string
  identity_verification_flow_url: string
}

export default (opts) => {
  const { gravityLoaderWithoutAuthenticationFactory } = factories(opts)
  const gravityLoader = gravityLoaderWithoutAuthenticationFactory
  const gravityUncachedLoader = uncachedLoaderFactory(gravity, "gravity", opts)

  const [batchSaleLoader, batchSalesLoader] = createBatchLoaders({
    singleLoader: gravityLoader((id) => `sale/${id}`),
    multipleLoader: gravityLoader<{ id: string; is_auction: boolean }[]>(
      "sales"
    ),
  })

  const batchSaleArtworkLoader = createBatchSaleArtworkLoader(
    gravityUncachedLoader((id) => `sale/${id}/sale_artworks`)
  )

  type GravityCalculatedCostResponse = {
    display_bid_amount: string
    bid_amount_cents: number
    buyers_premium_cents: number
    display_buyers_premium: string
    subtotal_cents: number
    display_subtotal: string
    currency: string
  }

  return {
    featureLoader: (id: string) =>
      gravityLoader((id) => `feature/${id}`)(id).then(Gravity.Feature.check),
    createAccountRequestLoader: gravityLoader(
      "account_requests",
      {},
      { method: "POST" }
    ),
    artistArtworksLoader: gravityLoader((id) => `artist/${id}/artworks`),
    artistCareerHighlightsLoader: gravityLoader("artist_career_highlights"),
    artistGenesLoader: gravityLoader((id) => `artist/${id}/genome/genes`),
    artistLoader: gravityLoader((id) => `artist/${id}`),
    artistsLoader: gravityLoader("artists", {}, { headers: true }),
    artistsByLetterLoader: gravityLoader(
      (letter) => `artists/${letter}`,
      {},
      { headers: true }
    ),
    artistSeriesLoader: gravityLoader((id) => `artist_series/${id}`),
    artistSeriesListLoader: gravityLoader(
      "artist_series",
      {},
      { headers: true }
    ),
    artworkImageLoader: gravityLoader<
      any,
      { artwork_id: string; image_id: string }
    >(({ artwork_id, image_id }) => `artwork/${artwork_id}/image/${image_id}`),
    artworkLoader: gravityLoader((id) => `artwork/${id}`),
    artworksLoader: gravityLoader("artworks"),
    authenticationStatusLoader: gravityLoader("me", {}, { headers: true }),
    bidderLoader: gravityLoader((id) => `bidder/${id}`),
    collectionArtworksLoader: gravityLoader(
      (id) => `collection/${id}/artworks`,
      {},
      { headers: true }
    ),
    collectionLoader: gravityLoader((id) => `collection/${id}`),
    createInvoicePaymentLoader: gravityLoader(
      (id) => `invoice/${id}/payment`,
      {},
      { method: "POST" }
    ),
    devicesLoader: gravityLoader("devices", {}, { headers: true }),
    exchangeRatesLoader: gravityLoader(
      "exchange_rates",
      {},
      { requestThrottleMs: 1000 * 60 * 60 }
    ),
    fairArtistsLoader: gravityLoader(
      (id) => `fair/${id}/artists`,
      {},
      { headers: true }
    ),
    fairBoothsLoader: gravityLoader(
      (id) => `fair/${id}/shows`,
      {},
      { headers: true }
    ),
    fairPartnersLoader: gravityLoader(
      (id) => `fair/${id}/partners`,
      {},
      { headers: true }
    ),
    fairLoader: gravityLoader((id) => `fair/${id}`),
    fairOrganizerLoader: gravityLoader((id) => `fair_organizer/${id}`),
    fairsLoader: gravityLoader("fairs", {}, { headers: true }),
    filterArtworksLoader: gravityLoader(
      "filter/artworks",
      {},
      { requestThrottleMs: 1000 * 60 * 60 }
    ),
    filterArtworksUncachedLoader: gravityUncachedLoader("filter/artworks"),
    geneArtistsLoader: gravityLoader((id) => `gene/${id}/artists`),
    geneFamiliesLoader: gravityLoader("gene_families"),
    geneLoader: gravityLoader((id) => `gene/${id}`),
    genesLoader: gravityLoader("genes"),
    siteHeroUnitLoader: gravityLoader((id) => `site_hero_unit/${id}`),
    siteHeroUnitsLoader: gravityLoader("site_hero_units"),
    heroUnitsLoader: gravityLoader("hero_units", {}, { headers: true }),
    heroUnitLoader: gravityLoader(
      (id) => `hero_units/${id}`,
      {},
      { headers: true }
    ),
    identityVerificationLoader: gravityUncachedLoader(
      (id) => `identity_verification/${id}`
    ),
    incrementsLoader: gravityLoader("increments"),
    inquiryRequestQuestionsLoader: gravityLoader(`inquiry_request_questions`),
    invoicesLoader: gravityUncachedLoader("invoice"),
    marketingCollectionLoader: gravityLoader(
      (id) => `marketing_collections/${id}`
    ),
    marketingCollectionsLoader: gravityLoader(
      "marketing_collections",
      {},
      { headers: true }
    ),
    marketingCategoriesLoader: gravityLoader(
      "marketing_collections_categories"
    ),
    matchArtistsLoader: gravityLoader("match/artists", {}, { headers: true }),
    matchGenesLoader: gravityLoader("match/genes"),
    anonNotificationPreferencesLoader: gravityLoader(
      (authenticationToken) =>
        `notification_preferences/?authentication_token=${authenticationToken}`
    ),
    anonUpdateNotificationPreferencesLoader: gravityLoader(
      (authenticationToken) =>
        `notification_preferences/?authentication_token=${authenticationToken}`,
      {},
      { method: "POST" }
    ),
    pageLoader: gravityLoader((id) => `page/${id}`),
    partnerArtistLoader: gravityLoader<
      any,
      { artist_id: string; partner_id: string }
    >(
      ({ artist_id, partner_id }) => `partner/${partner_id}/artist/${artist_id}`
    ),
    partnerArtistPartnerArtistArtworksLoader: gravityLoader<
      any,
      { artistID: string; partnerID: string }
    >(
      ({ artistID, partnerID }) =>
        `partner/${partnerID}/artist/${artistID}/partner_artist_artworks`,
      {},
      { headers: true }
    ),
    partnerArtistsForArtistLoader: gravityLoader(
      (id) => `artist/${id}/partner_artists`
    ),
    partnerArtistsForPartnerLoader: gravityLoader(
      (id) => `partner/${id}/partner_artists`,
      {},
      { headers: true }
    ),
    partnerArtistsLoader: gravityLoader(
      "partner_artists",
      {},
      { headers: true }
    ),
    partnerArtworksLoader: gravityLoader(
      (id) => `partner/${id}/artworks`,
      {},
      { headers: true }
    ),
    partnerCategoriesLoader: gravityLoader("partner_categories"),
    partnerCategoryLoader: gravityLoader((id) => `partner_category/${id}`),
    partnerLoader: gravityLoader((id) => `partner/${id}`),
    partnerLocationsLoader: gravityLoader((id) => `partner/${id}/locations`),
    partnerLocationsConnectionLoader: gravityLoader(
      (id) => `partner/${id}/locations`,
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
    partnerShowArtistsLoader: gravityLoader<
      any,
      { partner_id: string; show_id: string }
    >(
      ({ partner_id, show_id }) =>
        `partner/${partner_id}/show/${show_id}/artists`,
      {},
      { headers: true }
    ),
    partnerShowLoader: gravityLoader<
      any,
      { partner_id: string; show_id: string }
    >(({ partner_id, show_id }) => `partner/${partner_id}/show/${show_id}`),
    partnerShowsLoader: gravityLoader(
      (partner_id) => `partner/${partner_id}/shows`,
      {},
      { headers: true }
    ),
    partnersLoader: gravityLoader("partners", {}, { headers: true }),
    popularArtistsLoader: gravityLoader(`artists/popular`),
    profileLoader: gravityLoader((id) => `profile/${id}`),
    relatedArtworksLoader: gravityLoader("related/artworks"),
    relatedContemporaryArtistsLoader: gravityLoader(
      "related/layer/contemporary/artists",
      {},
      { headers: true }
    ),
    relatedFairsLoader: gravityLoader<{ has_full_feature: boolean }[]>(
      "related/fairs"
    ),
    relatedGenesLoader: gravityLoader("related/genes"),
    relatedLayerArtworksLoader: gravityLoader<
      any,
      { id: string; type: string }
    >(({ type, id }) => `related/layer/${type}/${id}/artworks`),
    relatedLayersLoader: gravityLoader("related/layers"),
    relatedMainArtistsLoader: gravityLoader(
      "related/layer/main/artists",
      {},
      { headers: true }
    ),
    relatedSalesLoader: gravityLoader("related/sales"),
    relatedShowsLoader: gravityLoader("related/shows", {}, { headers: true }),
    saleArtworkRootLoader: gravityUncachedLoader(
      (id) => `sale_artwork/${id}`,
      null
    ),
    saleArtworksFilterLoader: gravityLoader("filter/sale_artworks"),
    uncachedSaleArtworksLoader: gravityUncachedLoader(
      (id) => `sale/${id}/sale_artworks`,
      { headers: true }
    ),
    saleArtworksAllLoader: gravityLoader(
      "sale_artworks",
      {},
      { headers: true }
    ),
    saleArtworksLoader: gravityLoader(
      (id) => `sale/${id}/sale_artworks`,
      {},
      { headers: true }
    ),
    saleArtworkLoader: config.ENABLE_SALE_ARTWORK_REQUEST_BATCHING
      ? batchSaleArtworkLoader
      : gravityUncachedLoader<any, { saleId: string; artworkId: string }>(
          ({ saleId, artworkId }) => `sale/${saleId}/sale_artwork/${artworkId}`,
          null
        ),
    saleArtworkCalculatedCostLoader: gravityLoader<
      GravityCalculatedCostResponse,
      { saleId: string; saleArtworkId: string; bidAmountMinor: number }
    >(
      ({ saleId, saleArtworkId, bidAmountMinor }) =>
        `sale/${saleId}/sale_artwork/${saleArtworkId}/calculated_cost?bid_amount_cents=${bidAmountMinor}`
    ),
    saleLoader: batchSaleLoader,
    salesLoader: batchSalesLoader,
    salesLoaderWithHeaders: gravityLoader("sales", {}, { headers: true }),
    saleAgreementLoader: gravityLoader((id) => `sale_agreements/${id}`),
    saleAgreementsLoader: gravityLoader(
      "sale_agreements",
      {},
      { headers: true }
    ),
    saleSaleAgreementLoader: gravityLoader((id) => `sale/${id}/sale_agreement`),
    searchLoader: searchLoader(gravityLoader),
    sendFeedbackLoader: gravityLoader("feedback", {}, { method: "POST" }),
    setItemsLoader: gravityLoader(
      (id) => `set/${id}/items`,
      {},
      { headers: true }
    ),
    setLoader: gravityLoader((id) => `set/${id}`),
    setsLoader: gravityLoader("sets", {}, { headers: true }),
    shortcutLoader: gravityLoader((id) => `shortcut/${id}`),
    showLoader: gravityLoader((id) => `show/${id}`),
    showsLoader: gravityLoader("shows"),
    showsWithHeadersLoader: gravityLoader("shows", {}, { headers: true }),
    similarArtworksLoader: gravityLoader("related/artworks"),
    recentlyViewedArtworkIdsLoader: gravityLoader(
      (id) => `user/${id}/recently_viewed_artwork_ids`,
      {},
      { headers: true }
    ),
    similarGenesLoader: gravityLoader(
      (id) => `gene/${id}/similar`,
      {},
      { headers: true }
    ),
    startIdentityVerificationLoader: gravityLoader(
      (id) => `identity_verification/${id}/start`,
      {},
      { method: "PUT" }
    ),
    staticContentLoader: gravityLoader((id) => `page/${id}`),
    tagLoader: gravityLoader((id) => `tag/${id}`),
    trendingArtistsLoader: gravityLoader("artists/trending"),
    userByEmailLoader: gravityLoader("user", {}, { method: "GET" }),
    userByIDLoader: gravityLoader((id) => `user/${id}`, {}, { method: "GET" }),
    userIdentificationLoader: gravityLoader(
      "user/identify",
      {},
      { method: "POST" } // Un-cached
    ),
    verifiedRepresentativesLoader: gravityLoader<any, { artist_id: string }>(
      ({ artist_id }) => `verified_representatives?artist_id=${artist_id}`,
      {},
      { method: "GET" }
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
