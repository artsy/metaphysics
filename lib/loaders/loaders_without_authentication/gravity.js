// @ts-check
import factories from "../api"

export default requestID => {
  const { gravityLoaderWithoutAuthenticationFactory } = factories(requestID)
  const gravityLoader = gravityLoaderWithoutAuthenticationFactory

  return {
    artistArtworksLoader: gravityLoader(id => `artist/${id}/artworks`),
    artistLoader: gravityLoader(id => `artist/${id}`),
    artworkLoader: gravityLoader(id => `artwork/${id}`),
    fairsLoader: gravityLoader("fairs"),
    geneFamiliesLoader: gravityLoader("gene_families"),
    matchGeneLoader: gravityLoader("match/genes"),
    partnerArtistsForArtistLoader: gravityLoader(id => `artist/${id}/partner_artists`),
    partnerArtistsLoader: gravityLoader("partner_artists"),
    partnerLoader: gravityLoader(id => `partner/${id}`),
    partnerShowImagesLoader: gravityLoader(id => `partner_show/${id}/images`),
    partnersLoader: gravityLoader("partners"),
    popularArtistsLoader: gravityLoader(`artists/popular`),
    relatedArtworksLoader: gravityLoader("related/artworks"),
    relatedContemporaryArtistsLoader: gravityLoader("related/layer/contemporary/artists"),
    relatedFairsLoader: gravityLoader("related/fairs"),
    relatedMainArtistsLoader: gravityLoader("related/layer/main/artists"),
    relatedSalesLoader: gravityLoader("related/sales"),
    relatedShowsLoader: gravityLoader("related/shows"),
    saleLoader: gravityLoader(id => `sale/${id}`),
    salesLoader: gravityLoader("sales"),
  }
}
