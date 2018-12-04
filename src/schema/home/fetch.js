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

export const featuredFair = fairsLoader => {
  return fairsLoader({
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

    return undefined
  })
}

export const activeSaleArtworks = lotStandingLoader => {
  return lotStandingLoader({
    live: true,
  })
    .then(results => {
      return results.map(result => result.sale_artwork)
    })
    .then(sale_artworks => map(sale_artworks, "artwork"))
}

export const featuredAuction = salesLoader => {
  return salesLoader({
    live: true,
    size: 1,
    sort: "timely_at,name",
  }).then(sales => {
    if (sales.length) {
      return first(sales)
    }

    return undefined
  })
}

export const followedGenes = (followedGenesLoader, size) => {
  return followedGenesLoader({ size }).then(({ body }) => body)
}

export const featuredGene = followedGenesLoader => {
  return followedGenes(followedGenesLoader, 1).then(follows => {
    if (follows.length) {
      return first(follows).gene
    }

    return undefined
  })
}

export const geneArtworks = (filterArtworksLoader, id, size) => {
  return filterArtworksLoader({
    gene_id: id,
    for_sale: true,
    size: 60,
  }).then(({ hits }) => {
    return slice(shuffle(hits), 0, size)
  })
}

export const relatedArtists = suggestedSimilarArtistsLoader => {
  return suggestedSimilarArtistsLoader({
    exclude_artists_without_forsale_artworks: true,
    exclude_followed_artists: true,
    size: 20,
  }).then(({ body }) => {
    const filteredResults = filter(body, result => {
      return result.sim_artist.forsale_artworks_count > 0
    })
    return sampleSize(filteredResults, 2)
  })
}

export const popularArtists = deltaLoader => {
  return deltaLoader({
    method: "fetch",
    n: 9,
    name: "artist_follow_2t",
  }).then(trending => {
    const clonedTrending = clone(trending)
    forEach(blacklist, id => delete clonedTrending[id])
    return clonedTrending
  })
}
