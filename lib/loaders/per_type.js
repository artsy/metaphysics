import gravity from "lib/apis/gravity"
import positron from "lib/apis/positron"
import { toKey } from "lib/helpers"
import httpLoader from "./http"

// TODO As we’re currently re-using the http loader as it was, it won’t support batching yet.
//      We should rework that once we’ve changed all resolve functions to only use per-type loaders.
const apiLoader = (api, path) => {
  const loader = httpLoader(api)
  return (id, params) => {
    const key = toKey(typeof path === "function" ? path(id) : path, params)
    return loader.load(key)
  }
}
const gravityLoader = apiLoader.bind(null, gravity)
const positronLoader = apiLoader.bind(null, positron)

export default () => {
  return {
    articlesLoader: positronLoader("articles"),
    artistArtworksLoader: gravityLoader(id => `artist/${id}/artworks`),
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
  }
}
