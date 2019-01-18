// @ts-check
import factories from "../api"
import { uncachedLoaderFactory } from "lib/loaders/api/loader_without_cache_factory"
import gravity from "lib/apis/gravity"
import DataLoader from "dataloader"
import { groupBy, flatten } from 'lodash'

export default opts => {
  const { gravityLoaderWithoutAuthenticationFactory } = factories(opts)
  const gravityLoader = gravityLoaderWithoutAuthenticationFactory
  const gravityUncachedLoader = uncachedLoaderFactory(gravity, "gravity")

  const renderParams = (key) => {
    if (typeof key === "string") {
      return ""
    }
    const { id: [id], ...params} = key;
    return Object.entries(params).map(entry => entry.join('=')).sort().join('&')
  }

  const batchLoader = (singleLoader, multipleLoader, defaultResult: any = null) => {
    const dl = new DataLoader(keys => {

    let groupedKeys = Object.values(groupBy(keys, renderParams)).map(keys => {
      if (typeof keys[0] === "string") {
        return { id: keys }
      }
      return {
        ...keys[0],
        id: keys.map(k => k.id)
      }
    })

    return Promise.all(
      groupedKeys
      .map(keys => {
        console.log(keys.id)
      if (keys.id.length === 1) {
        return singleLoader(keys)
      } else {
        return multipleLoader(keys).then(results => console.log('RESULT', results.length) || results)
      }
    })).then(data => {
      const normalizedResults = data.map((queriedGroup, groupIndex) => {
        return groupedKeys[groupIndex].id.map(id => 
          queriedGroup.find(r => 
            r._id === id
            ) || defaultResult
        )
      })
      return flatten(normalizedResults)
    })
  })

  return (key) => dl.load(key)
}

  const batchSaleLoader = batchLoader(gravityLoader(id => `sale/${id}`), gravityLoader("sales"))
  const batchSalesLoader = batchLoader(gravityLoader(id => `sale/${id}`), gravityLoader("sales"), [])

  return {
    artistArtworksLoader: gravityLoader(id => `artist/${id}/artworks`),
    artistGenesLoader: gravityLoader(({ id }) => `artist/${id}/genome/genes`),
    artistLoader: gravityLoader(id => `artist/${id}`),
    artistsLoader: gravityLoader("artists"),
    artworkImageLoader: gravityLoader(({ artwork_id, image_id }) => `artwork/${artwork_id}/image/${image_id}`),
    artworkLoader: gravityLoader(id => `artwork/${id}`),
    artworksLoader: gravityLoader("artworks"),
    fairArtistsLoader: gravityLoader(id => `fair/${id}/artists`, {}, { headers: true }),
    fairBoothsLoader: gravityLoader(id => `fair/${id}/shows`, {}, { headers: true }),
    fairPartnersLoader: gravityLoader(id => `fair/${id}/partners`, {}, { headers: true }),
    fairLoader: gravityLoader(id => `fair/${id}`),
    fairsLoader: gravityLoader("fairs"),
    filterArtworksLoader: gravityLoader("filter/artworks"),
    geneArtistsLoader: gravityLoader(id => `gene/${id}/artists`),
    geneFamiliesLoader: gravityLoader("gene_families"),
    geneLoader: gravityLoader(id => `gene/${id}`),
    genesLoader: gravityLoader("genes"),
    heroUnitsLoader: gravityLoader("site_hero_units"),
    incrementsLoader: gravityLoader("increments"),
    matchArtistsLoader: gravityLoader("match/artists"),
    matchGeneLoader: gravityLoader("match/genes"),
    partnerArtistLoader: gravityLoader(({ artist_id, partner_id }) => `partner/${partner_id}/artist/${artist_id}`),
    partnerArtistsForArtistLoader: gravityLoader(id => `artist/${id}/partner_artists`),
    partnerArtistsLoader: gravityLoader("partner_artists", {}, { headers: true }),
    partnerArtworksLoader: gravityLoader(id => `partner/${id}/artworks`, {}, { headers: true }),
    partnerCategoriesLoader: gravityLoader("partner_categories"),
    partnerCategoryLoader: gravityLoader(id => `partner_category/${id}`),
    partnerLoader: gravityLoader(id => `partner/${id}`),
    partnerLocationsLoader: gravityLoader(id => `partner/${id}/locations`),
    partnerShowArtworksLoader: gravityLoader(({ partner_id, show_id }) => `partner/${partner_id}/show/${show_id}/artworks`, {}, { headers: true }),
    partnerShowImagesLoader: gravityLoader(id => `partner_show/${id}/images`),
    partnerShowArtistsLoader: gravityLoader(({ partner_id, show_id }) => `partner/${partner_id}/show/${show_id}/artists`, {}, { headers: true }),
    partnerShowLoader: gravityLoader(({ partner_id, show_id }) => `partner/${partner_id}/show/${show_id}`),
    partnersLoader: gravityLoader("partners"),
    popularArtistsLoader: gravityLoader(`artists/popular`),
    profileLoader: gravityLoader(id => `profile/${id}`),
    relatedArtworksLoader: gravityLoader("related/artworks"),
    relatedContemporaryArtistsLoader: gravityLoader("related/layer/contemporary/artists", {}, { headers: true }),
    relatedFairsLoader: gravityLoader("related/fairs"),
    relatedGenesLoader: gravityLoader("related/genes"),
    relatedLayerArtworksLoader: gravityLoader(({ type, id }) => `related/layer/${type}/${id}/artworks`),
    relatedLayersLoader: gravityLoader("related/layers"),
    relatedMainArtistsLoader: gravityLoader("related/layer/main/artists", {}, { headers: true }),
    relatedSalesLoader: gravityLoader("related/sales"),
    relatedShowsLoader: gravityLoader("related/shows", {}, { headers: true }),
    saleArtworkRootLoader: gravityUncachedLoader(id => `sale_artwork/${id}`, null),
    saleArtworksFilterLoader: gravityLoader("filter/sale_artworks"),
    saleArtworksLoader: gravityLoader(id => `sale/${id}/sale_artworks`, {}, { headers: true }),
    saleArtworkLoader: gravityUncachedLoader(({ saleId, saleArtworkId }) => `sale/${saleId}/sale_artwork/${saleArtworkId}`, null),
    // saleLoader: gravityLoader(id => `sale/${id}`),
    // salesLoader: gravityLoader("sales"),
    saleLoader: batchSaleLoader,
    salesLoader: batchSalesLoader,
    setItemsLoader: gravityLoader(id => `set/${id}/items`),
    setLoader: gravityLoader(id => `set/${id}`),
    setsLoader: gravityLoader("sets"),
    showLoader: gravityLoader(id => `show/${id}`),
    showsLoader: gravityLoader("shows"),
    showsWithHeadersLoader: gravityLoader("shows", {}, { headers: true }),
    similarArtworksLoader: gravityLoader("related/artworks"),
    similarGenesLoader: gravityLoader(id => `gene/${id}/similar`, {}, { headers: true }),
    systemTimeLoader: gravityUncachedLoader("system/time", null),
    tagLoader: gravityLoader(id => `tag/${id}`),
    trendingArtistsLoader: gravityLoader("artists/trending"),
    userByEmailLoader: gravityLoader("user", {}, { method: "GET" }),
    userByIDLoader: gravityLoader(id => `user/${id}`, {}, { method: "GET" }),
  }
}
