// @ts-check
import factories from "../api"

export default opts => {
  const { gravityLoaderWithoutAuthenticationFactory } = factories(opts)
  const gravityLoader = gravityLoaderWithoutAuthenticationFactory

  return {
    artworksLoader: gravityLoader("artworks"),
    artistArtworksLoader: gravityLoader(id => `artist/${id}/artworks`),
    artistLoader: gravityLoader(id => `artist/${id}`),
    artistsLoader: gravityLoader("artists"),
    artworkLoader: gravityLoader(id => `artwork/${id}`),
    fairLoader: gravityLoader(id => `fair/${id}`),
    fairBoothsLoader: gravityLoader(
      id => `fair/${id}/shows`,
      {},
      { headers: true }
    ),
    fairsLoader: gravityLoader("fairs"),
    filterArtworksLoader: gravityLoader("filter/artworks"),
    geneArtistsLoader: gravityLoader(id => `gene/${id}/artists`),
    geneFamiliesLoader: gravityLoader("gene_families"),
    geneLoader: gravityLoader(id => `gene/${id}`),
    heroUnitsLoader: gravityLoader("site_hero_units"),
    incrementsLoader: gravityLoader("increments"),
    matchGeneLoader: gravityLoader("match/genes"),
    matchArtistsLoader: gravityLoader("match/artists"),
    partnerArtistsForArtistLoader: gravityLoader(
      id => `artist/${id}/partner_artists`
    ),
    partnerArtistsLoader: gravityLoader(
      "partner_artists",
      {},
      { headers: true }
    ),
    partnerArtistLoader: gravityLoader(
      ({ artist_id, partner_id }) => `partner/${partner_id}/artist/${artist_id}`
    ),
    partnerArtworksLoader: gravityLoader(id => `partner/${id}/artworks`),
    partnerCategoriesLoader: gravityLoader("partner_categories"),
    partnerCategoryLoader: gravityLoader(id => `partner_category/${id}`),
    partnerLoader: gravityLoader(id => `partner/${id}`),
    partnerLocationsLoader: gravityLoader(id => `partner/${id}/locations`),
    partnerShowLoader: gravityLoader(
      ({ partner_id, show_id }) => `partner/${partner_id}/show/${show_id}`
    ),
    partnerShowArtworksLoader: gravityLoader(
      ({ partner_id, show_id }) =>
        `partner/${partner_id}/show/${show_id}/artworks`,
      {},
      { headers: true }
    ),
    partnerShowImagesLoader: gravityLoader(id => `partner_show/${id}/images`),
    partnersLoader: gravityLoader("partners"),
    popularArtistsLoader: gravityLoader(`artists/popular`),
    profileLoader: gravityLoader(id => `profile/${id}`),
    relatedArtworksLoader: gravityLoader("related/artworks"),
    relatedLayersLoader: gravityLoader("related/layers"),
    relatedLayerArtworksLoader: gravityLoader(
      ({ type, id }) => `related/layer/${type}/${id}/artworks`
    ),
    relatedContemporaryArtistsLoader: gravityLoader(
      "related/layer/contemporary/artists",
      {},
      { headers: true }
    ),
    relatedFairsLoader: gravityLoader("related/fairs"),
    relatedMainArtistsLoader: gravityLoader(
      "related/layer/main/artists",
      {},
      { headers: true }
    ),
    relatedSalesLoader: gravityLoader("related/sales"),
    relatedShowsLoader: gravityLoader("related/shows"),
    saleLoader: gravityLoader(id => `sale/${id}`),
    salesLoader: gravityLoader("sales"),
    saleArtworkLoader: gravityLoader(
      ({ saleId, saleArtworkId }) =>
        `sale/${saleId}/sale_artwork/${saleArtworkId}`
    ),
    saleArtworkRootLoader: gravityLoader(id => `sale_artwork/${id}`),
    saleArtworksLoader: gravityLoader(
      id => `sale/${id}/sale_artworks`,
      {},
      { headers: true }
    ),
    saleArtworksFilterLoader: gravityLoader("filter/sale_artworks"),
    setLoader: gravityLoader(id => `set/${id}`),
    setItemsLoader: gravityLoader(id => `set/${id}/items`),
    setsLoader: gravityLoader("sets"),
    showLoader: gravityLoader(id => `show/${id}`),
    showsLoader: gravityLoader("shows"),
    similarGenesLoader: gravityLoader(
      id => `gene/${id}/similar`,
      {},
      { headers: true }
    ),
    tagLoader: gravityLoader(id => `tag/${id}`),
    trendingArtistsLoader: gravityLoader("artists/trending"),
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
  }
}
