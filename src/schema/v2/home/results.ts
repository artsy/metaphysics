import {
  activeSaleArtworks,
  featuredAuction,
  featuredFair,
  featuredGene,
  geneArtworks,
  popularArtists,
} from "./fetch"
import { map, assign, keys, without, shuffle, slice } from "lodash"
import Artwork from "schema/v2/artwork/index"
import { GraphQLList, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  HomePageArtworkModuleDetails,
  HomePageArtworkModuleResolvers,
  isFollowedArtistArtworkModuleParams,
  isFollowedGeneArtworkModuleParams,
  isRelatedArtistArtworkModuleParams,
} from "./types"

const RESULTS_SIZE = 20

const moduleResults: HomePageArtworkModuleResolvers<any> = {
  active_bids: ({ lotStandingLoader }) => activeSaleArtworks(lotStandingLoader),
  current_fairs: ({ fairsLoader, filterArtworksLoader }) => {
    return featuredFair(fairsLoader).then<any[] | null>((fair) => {
      if (fair) {
        return filterArtworksLoader({
          fair_id: fair.id,
          for_sale: true,
          size: 60,
        }).then(({ hits }) => {
          return slice(shuffle(hits), 0, RESULTS_SIZE)
        })
      } else {
        return null
      }
    })
  },
  followed_artist: ({ filterArtworksLoader }, params) => {
    if (!isFollowedArtistArtworkModuleParams(params)) return null
    return filterArtworksLoader({
      artist_id: params.followed_artist_id,
      for_sale: true,
      size: RESULTS_SIZE,
    }).then(({ hits }) => hits)
  },
  followed_artists: ({ followedArtistsArtworksLoader }) => {
    if (!followedArtistsArtworksLoader) return null
    return followedArtistsArtworksLoader({
      for_sale: true,
      size: RESULTS_SIZE,
    }).then(({ body }) => body)
  },
  followed_galleries: ({ followedProfilesArtworksLoader }) => {
    if (!followedProfilesArtworksLoader) return null
    return followedProfilesArtworksLoader({
      for_sale: true,
      size: 60,
    }).then(({ body }) => {
      return slice(shuffle(body), 0, RESULTS_SIZE)
    })
  },
  genes: ({ filterArtworksLoader, followedGenesLoader }, params) => {
    if (isFollowedGeneArtworkModuleParams(params)) {
      return geneArtworks(filterArtworksLoader, params.id, RESULTS_SIZE)
    }
    // Backward compatibility for Force.
    return featuredGene(followedGenesLoader).then((gene) => {
      if (gene) {
        return geneArtworks(filterArtworksLoader, gene.id, RESULTS_SIZE)
      }

      return null
    })
  },
  generic_gene: ({ filterArtworksLoader }, params) => {
    return filterArtworksLoader(
      assign({}, params, { size: RESULTS_SIZE, for_sale: true })
    ).then(({ hits }) => hits)
  },
  live_auctions: ({ salesLoader, saleArtworksLoader }) => {
    return featuredAuction(salesLoader).then((auction) => {
      if (auction) {
        return saleArtworksLoader(auction.id, {
          size: RESULTS_SIZE,
        }).then(({ body }) => {
          return map(body, "artwork")
        })
      }
      return null
    })
  },
  popular_artists: ({ filterArtworksLoader, deltaLoader }) => {
    // TODO This appears to largely replicate Gravity’s /api/v1/artists/popular endpoint
    return popularArtists(deltaLoader).then((artists) => {
      const ids = without(keys(artists), "cached", "context_type")
      return filterArtworksLoader({
        artist_ids: ids,
        size: RESULTS_SIZE,
        sort: "-partner_updated_at",
      }).then(({ hits }) => hits)
    })
  },
  recommended_works: ({ homepageSuggestedArtworksLoader }) => {
    if (!homepageSuggestedArtworksLoader) return null
    return homepageSuggestedArtworksLoader({
      limit: RESULTS_SIZE,
    })
  },
  related_artists: ({ filterArtworksLoader }, params) => {
    if (!isRelatedArtistArtworkModuleParams(params)) return null
    return filterArtworksLoader({
      artist_id: params.related_artist_id,
      for_sale: true,
      size: RESULTS_SIZE,
    }).then(({ hits }) => hits)
  },
  saved_works: async ({ savedArtworksLoader, userID }) => {
    if (!savedArtworksLoader || !userID) return null
    const { body } = await savedArtworksLoader({
      size: RESULTS_SIZE,
      sort: "-position",
      user_id: userID,
      private: true,
    })

    return body
  },
  similar_to_saved_works: async ({
    savedArtworksLoader,
    similarArtworksLoader,
    userID,
  }) => {
    if (!savedArtworksLoader || !userID) return null
    const { body: works } = await savedArtworksLoader({
      size: RESULTS_SIZE,
      sort: "-position",
      user_id: userID,
      private: true,
    })
    return similarArtworksLoader({
      artwork_id: map(works, "_id").slice(0, 7),
      for_sale: true,
    })
  },
  similar_to_recently_viewed: ({ meLoader, similarArtworksLoader }) => {
    if (!meLoader) return null
    return meLoader().then(({ recently_viewed_artwork_ids }) => {
      if (recently_viewed_artwork_ids.length === 0) {
        return []
      }
      const recentlyViewedIds = recently_viewed_artwork_ids.slice(0, 7)
      return similarArtworksLoader({
        artwork_id: recentlyViewedIds,
        for_sale: true,
      })
    })
  },
  recently_viewed_works: ({ meLoader, artworksLoader }) => {
    if (!meLoader) return null
    return meLoader().then(({ recently_viewed_artwork_ids }) => {
      if (recently_viewed_artwork_ids.length === 0) {
        return []
      }
      const ids = recently_viewed_artwork_ids.slice(0, RESULTS_SIZE)
      return artworksLoader({ ids })
    })
  },
}

const Results: GraphQLFieldConfig<
  HomePageArtworkModuleDetails,
  ResolverContext
> = {
  type: new GraphQLList(Artwork.type),
  resolve: ({ key, display, params }, _options, context) => {
    if (display) {
      return moduleResults[key](context, params)
    }
  },
}

export default Results
