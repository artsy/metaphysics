// @ts-check
import gravity from "../../apis/gravity"
import factories from "../api"

import { loaderOneOffFactory } from "../api/loader_one_off_factory"

export default requestID => {
  const { gravityLoaderWithoutAuthenticationFactory } = factories(requestID)
  const gravityLoader = gravityLoaderWithoutAuthenticationFactory
  const oneOffLoader = path => options => loaderOneOffFactory(gravity, path, options)
  return {
    artistArtworksLoader: gravityLoader(id => `artist/${id}/artworks`),
    popularArtistsLoader: gravityLoader(`artists/popular`),
    artistLoader: gravityLoader(id => `artist/${id}`),
    artworkLoader: gravityLoader(id => `artwork/${id}`),
    fairsLoader: gravityLoader("fairs"),
    geneFamiliesLoader: gravityLoader("gene_families"),
    partnerArtistsLoader: gravityLoader(id => `artist/${id}/partner_artists`),
    partnerLoader: gravityLoader(id => `partner/${id}`),
    partnerShowImagesLoader: gravityLoader(id => `partner_show/${id}/images`),
    relatedArtworksLoader: gravityLoader("related/artworks"),
    relatedContemporaryArtistsLoader: gravityLoader("related/layer/contemporary/artists"),
    relatedFairsLoader: gravityLoader("related/fairs"),
    relatedMainArtistsLoader: gravityLoader("related/layer/main/artists"),
    relatedSalesLoader: gravityLoader("related/sales"),
    relatedShowsLoader: gravityLoader("related/shows"),
    saleLoader: gravityLoader(id => `sale/${id}`),
    salesLoader: gravityLoader("sales"),
    matchGeneLoader: gravityLoader("match/genes"),
    timeLoader: oneOffLoader("system/time"),
  }
}
