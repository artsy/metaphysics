import gravity from "lib/apis/gravity"
import positron from "lib/apis/positron"
import { toKey } from "lib/helpers"
import cachingHttpLoader from "./legacy/http"

// TODO move to impulse file?
import DataLoader from "dataloader"
const { IMPULSE_APPLICATION_ID } = process.env

// TODO As we’re currently re-using the http loader as it was, it won’t support batching yet.
//      We should rework that once we’ve changed all resolve functions to only use per-type loaders.
const cachingAPILoader = (api, path) => {
  const loader = cachingHttpLoader(api)
  return (id, params) => {
    const key = toKey(typeof path === "function" ? path(id) : path, params)
    return loader.load(key)
  }
}

/**
 * This loader caches all responses to memcache. Do NOT use this for authenticated requests!
 */
const gravityLoader = cachingAPILoader.bind(null, gravity)
const positronLoader = cachingAPILoader.bind(null, positron)

/**
 * This loader does cache responses for the duration of query execution but does not cache to memcache. Use this for
 * authenticated requests.
 */
const authenticatedGravityLoaderFactory = accessToken => {
  return (path, apiOptions = {}, globalParams = {}) => {
    const loader = new DataLoader(
      keys => {
        return Promise.all(
          keys.map(key => {
            console.log(key)
            // TODO basically replicate authenticated_http.js
            return gravity(key, accessToken, apiOptions).then(response => response.body)
          })
        )
      },
      {
        batch: true,
        cache: true,
      }
    )
    return (id, params = {}) => {
      const key = toKey(typeof path === "function" ? path(id) : path, Object.assign({}, globalParams, params))
      return loader.load(key)
    }
  }
}

export default accessToken => {
  const loaders = {
    articlesLoader: positronLoader("articles"),
    articleLoader: positronLoader(id => `articles/${id}`),
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

  // Authenticated loaders
  if (accessToken) {
    const authenticatedGravityLoader = authenticatedGravityLoaderFactory(accessToken)
    return Object.assign(loaders, {
      impulseTokenLoader: authenticatedGravityLoader(
        "me/token",
        { method: "POST" },
        { client_application_id: IMPULSE_APPLICATION_ID }
      ),
    })
  }

  return loaders
}
