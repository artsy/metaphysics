// @ts-check
import factories from "../api"

export default opts => {
  const { gravityLoaderWithoutAuthenticationFactory } = factories(opts)
  const gravityLoader = gravityLoaderWithoutAuthenticationFactory

  return {
    artworksLoader: gravityLoader("artworks"),
    artistArtworksLoader: gravityLoader(id => {return `artist/${id}/artworks`}),
    artistGenesLoader: gravityLoader(({ id }) => {return `artist/${id}/genome/genes`}),
    artistLoader: gravityLoader(id => {return `artist/${id}`}),
    artistsLoader: gravityLoader("artists"),
    artworkLoader: gravityLoader(id => {return `artwork/${id}`}),
    fairLoader: gravityLoader(id => {return `fair/${id}`}),
    fairBoothsLoader: gravityLoader(
      id => {return `fair/${id}/shows`},
      {},
      { headers: true }
    ),
    fairsLoader: gravityLoader("fairs"),
    filterArtworksLoader: gravityLoader("filter/artworks"),
    genesLoader: gravityLoader("genes"),
    geneArtistsLoader: gravityLoader(id => {return `gene/${id}/artists`}),
    geneFamiliesLoader: gravityLoader("gene_families"),
    geneLoader: gravityLoader(id => {return `gene/${id}`}),
    heroUnitsLoader: gravityLoader("site_hero_units"),
    incrementsLoader: gravityLoader("increments"),
    matchGeneLoader: gravityLoader("match/genes"),
    matchArtistsLoader: gravityLoader("match/artists"),
    partnerArtistsForArtistLoader: gravityLoader(
      id => {return `artist/${id}/partner_artists`}
    ),
    partnerArtistsLoader: gravityLoader(
      "partner_artists",
      {},
      { headers: true }
    ),
    partnerArtistLoader: gravityLoader(
      ({ artist_id, partner_id }) => {return `partner/${partner_id}/artist/${artist_id}`}
    ),
    partnerArtworksLoader: gravityLoader(id => {return `partner/${id}/artworks`}),
    partnerCategoriesLoader: gravityLoader("partner_categories"),
    partnerCategoryLoader: gravityLoader(id => {return `partner_category/${id}`}),
    partnerLoader: gravityLoader(id => {return `partner/${id}`}),
    partnerLocationsLoader: gravityLoader(id => {return `partner/${id}/locations`}),
    partnerShowLoader: gravityLoader(
      ({ partner_id, show_id }) => {return `partner/${partner_id}/show/${show_id}`}
    ),
    partnerShowArtworksLoader: gravityLoader(
      ({ partner_id, show_id }) =>
        {return `partner/${partner_id}/show/${show_id}/artworks`},
      {},
      { headers: true }
    ),
    partnerShowImagesLoader: gravityLoader(id => {return `partner_show/${id}/images`}),
    partnersLoader: gravityLoader("partners"),
    popularArtistsLoader: gravityLoader("artists/popular"),
    profileLoader: gravityLoader(id => {return `profile/${id}`}),
    relatedArtworksLoader: gravityLoader("related/artworks"),
    relatedLayersLoader: gravityLoader("related/layers"),
    relatedLayerArtworksLoader: gravityLoader(
      ({ type, id }) => {return `related/layer/${type}/${id}/artworks`}
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
    saleLoader: gravityLoader(id => {return `sale/${id}`}),
    salesLoader: gravityLoader("sales"),
    saleArtworkLoader: gravityLoader(
      ({ saleId, saleArtworkId }) =>
        {return `sale/${saleId}/sale_artwork/${saleArtworkId}`}
    ),
    saleArtworkRootLoader: gravityLoader(id => {return `sale_artwork/${id}`}),
    saleArtworksLoader: gravityLoader(
      id => {return `sale/${id}/sale_artworks`},
      {},
      { headers: true }
    ),
    saleArtworksFilterLoader: gravityLoader("filter/sale_artworks"),
    setLoader: gravityLoader(id => {return `set/${id}`}),
    setItemsLoader: gravityLoader(id => {return `set/${id}/items`}),
    setsLoader: gravityLoader("sets"),
    showLoader: gravityLoader(id => {return `show/${id}`}),
    showsLoader: gravityLoader("shows"),
    similarArtworksLoader: gravityLoader("related/artworks"),
    similarGenesLoader: gravityLoader(
      id => {return `gene/${id}/similar`},
      {},
      { headers: true }
    ),
    tagLoader: gravityLoader(id => {return `tag/${id}`}),
    trendingArtistsLoader: gravityLoader("artists/trending"),
    updateOrderLoader: gravityLoader(
      id => {return `me/order/${id}`},
      {},
      { method: "PUT" }
    ),
    userLoader: gravityLoader("user", {}, { method: "GET" }),
    submitOrderLoader: gravityLoader(
      id => {return `me/order/${id}/submit`},
      {},
      { method: "PUT" }
    ),
  }
}
