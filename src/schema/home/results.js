import {
  activeSaleArtworks,
  featuredAuction,
  featuredFair,
  featuredGene,
  geneArtworks,
  popularArtists,
} from "./fetch"
import { map, assign, keys, without, shuffle, slice } from "lodash"
import Artwork from "schema/artwork/index"
import { GraphQLList } from "graphql"

const RESULTS_SIZE = 20

const moduleResults = {
  active_bids: ({ rootValue: { lotStandingLoader } }) =>
    activeSaleArtworks(lotStandingLoader),
  current_fairs: ({ rootValue: { fairsLoader, filterArtworksLoader } }) => {
    return featuredFair(fairsLoader).then(fair => {
      if (fair) {
        return filterArtworksLoader({
          fair_id: fair.id,
          for_sale: true,
          size: 60,
        }).then(({ hits }) => {
          return slice(shuffle(hits), 0, RESULTS_SIZE)
        })
      } else {
        return undefined
      }
    })
  },
  followed_artist: ({ rootValue: { filterArtworksLoader }, params }) => {
    return filterArtworksLoader({
      artist_id: params.followed_artist_id,
      for_sale: true,
      size: RESULTS_SIZE,
    }).then(({ hits }) => hits)
  },
  followed_artists: ({ rootValue: { followedArtistsArtworksLoader } }) => {
    return followedArtistsArtworksLoader({
      for_sale: true,
      size: RESULTS_SIZE,
    }).then(({ body }) => body)
  },
  followed_galleries: ({ rootValue: { followedProfilesArtworksLoader } }) => {
    return followedProfilesArtworksLoader({
      for_sale: true,
      size: 60,
    }).then(({ body }) => {
      return slice(shuffle(body), 0, RESULTS_SIZE)
    })
  },
  genes: ({
    rootValue: { filterArtworksLoader, followedGenesLoader },
    params: { id },
  }) => {
    if (id) {
      return geneArtworks(filterArtworksLoader, id, RESULTS_SIZE)
    }
    // Backward compatibility for Force.
    return featuredGene(followedGenesLoader).then(gene => {
      if (gene) {
        return geneArtworks(filterArtworksLoader, gene.id, RESULTS_SIZE)
      }

      return undefined
    })
  },
  generic_gene: ({ rootValue: { filterArtworksLoader }, params }) => {
    return filterArtworksLoader(
      assign({}, params, { size: RESULTS_SIZE, for_sale: true })
    ).then(({ hits }) => hits)
  },
  live_auctions: ({ rootValue: { salesLoader, saleArtworksLoader } }) => {
    return featuredAuction(salesLoader).then(auction => {
      if (auction) {
        return saleArtworksLoader(auction.id, {
          size: RESULTS_SIZE,
        }).then(({ body }) => {
          return map(body, "artwork")
        })
      }

      return undefined
    })
  },
  popular_artists: ({ rootValue: { filterArtworksLoader, deltaLoader } }) => {
    // TODO This appears to largely replicate Gravity’s /api/v1/artists/popular endpoint
    return popularArtists(deltaLoader).then(artists => {
      const ids = without(keys(artists), "cached", "context_type")
      return filterArtworksLoader({
        artist_ids: ids,
        size: RESULTS_SIZE,
        sort: "-partner_updated_at",
      }).then(({ hits }) => hits)
    })
  },
  recommended_works: ({ rootValue: { homepageSuggestedArtworksLoader } }) => {
    return homepageSuggestedArtworksLoader({
      limit: RESULTS_SIZE,
    })
  },
  related_artists: ({ rootValue: { filterArtworksLoader }, params }) => {
    return filterArtworksLoader({
      artist_id: params.related_artist_id,
      for_sale: true,
      size: RESULTS_SIZE,
    }).then(({ hits }) => hits)
  },
  saved_works: ({ rootValue: { savedArtworksLoader } }) => {
    return savedArtworksLoader({
      size: RESULTS_SIZE,
      sort: "-position",
    })
  },
  similar_to_saved_works: ({
    rootValue: { savedArtworksLoader, similarArtworksLoader },
  }) => {
    return savedArtworksLoader({
      size: RESULTS_SIZE,
      sort: "-position",
    }).then(works => {
      return similarArtworksLoader({
        artwork_id: map(works, "_id").slice(0, 7),
      })
    })
  },
  similar_to_recently_viewed: ({
    rootValue: { meLoader, similarArtworksLoader },
  }) => {
    return meLoader().then(({ recently_viewed_artwork_ids }) => {
      if (recently_viewed_artwork_ids.length === 0) {
        return []
      }
      const recentlyViewedIds = recently_viewed_artwork_ids.slice(0, 7)
      return similarArtworksLoader({ artwork_id: recentlyViewedIds })
    })
  },
  recently_viewed_works: ({ rootValue: { meLoader, artworksLoader } }) => {
    return meLoader().then(({ recently_viewed_artwork_ids }) => {
      if (recently_viewed_artwork_ids.length === 0) {
        return []
      }
      const ids = recently_viewed_artwork_ids.slice(0, RESULTS_SIZE)
      return artworksLoader({ ids })
    })
  },
}

export default {
  type: new GraphQLList(Artwork.type),
  resolve: ({ key, display, params }, options, request, { rootValue }) => {
    if (display) {
      return moduleResults[key]({ rootValue, params: params || {} })
    }
  },
}
