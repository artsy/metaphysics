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
    artistLoader: gravityLoader(id => `artist/${id}`),
    artworkLoader: gravityLoader(id => `artwork/${id}`),
    artistArtworksLoader: gravityLoader(id => `artist/${id}/artworks`),
    geneFamiliesLoader: gravityLoader("gene_families"),
    relatedArtworksLoader: gravityLoader("related/artworks"),
    relatedFairsLoader: gravityLoader("related/fairs"),
    relatedSalesLoader: gravityLoader("related/sales"),
    relatedShowsLoader: gravityLoader("related/shows"),
    relatedMainArtistsLoader: gravityLoader("related/layer/main/artists"),
    relatedContemporaryArtistsLoader: gravityLoader("related/layer/contemporary/artists"),
    partnerLoader: gravityLoader(id => `partner/${id}`),
    partnerArtistsLoader: gravityLoader(id => `artist/${id}/partner_artists`),
    partnerShowImagesLoader: gravityLoader(id => `partner_show/${id}/images`),
    saleLoader: gravityLoader(id => `sale/${id}`),
    salesLoader: gravityLoader("sales"),
  }
}
