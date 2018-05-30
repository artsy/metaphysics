import {
  clone,
  first,
  forEach,
  map,
  sampleSize,
  shuffle,
  slice,
  filter,
  sortBy,
} from "lodash"
import blacklist from "lib/artist_blacklist"

export const featuredFair = fairsLoader =>
  fairsLoader({
    size: 5,
    active: true,
    has_homepage_section: true,
  }).then(fairs => {
    if (fairs.length) {
      return first(
        sortBy(fairs, ({ banner_size }) =>
          ["x-large", "large", "medium", "small", "x-small"].indexOf(
            banner_size
          )
        )
      )
    }

    return undefined // make undefined return explicit
  })

export const activeSaleArtworks = lotStandingLoader =>
  lotStandingLoader({
    live: true,
  })
    .then(results => results.map(result => result.sale_artwork))
    .then(sale_artworks => map(sale_artworks, "artwork"))

export const featuredAuction = salesLoader =>
  salesLoader({
    live: true,
    size: 1,
    sort: "timely_at,name",
  }).then(sales => {
    if (sales.length) {
      return first(sales)
    }

    return undefined // make undefined return explicit
  })

export const followedGenes = (followedGenesLoader, size) =>
  followedGenesLoader({ size }).then(({ body }) => body)

export const featuredGene = followedGenesLoader =>
  followedGenes(followedGenesLoader, 1).then(follows => {
    if (follows.length) {
      return first(follows).gene
    }

    return undefined // make undefined return explicit
  })

export const geneArtworks = (filterArtworksLoader, id, size) =>
  filterArtworksLoader({
    gene_id: id,
    for_sale: true,
    size: 60,
  }).then(({ hits }) => slice(shuffle(hits), 0, size))

export const relatedArtists = suggestedSimilarArtistsLoader =>
  suggestedSimilarArtistsLoader({
    exclude_artists_without_forsale_artworks: true,
    exclude_followed_artists: true,
    size: 20,
  }).then(({ body }) => {
    const filteredResults = filter(
      body,
      result => result.sim_artist.forsale_artworks_count > 0
    )
    return sampleSize(filteredResults, 2)
  })

export const popularArtists = deltaLoader =>
  deltaLoader({
    method: "fetch",
    n: 9,
    name: "artist_follow_2t",
  }).then(trending => {
    const clonedTrending = clone(trending)
    forEach(blacklist, id => delete clonedTrending[id])
    return clonedTrending
  })
