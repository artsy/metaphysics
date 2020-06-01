import { featuredAuction, featuredFair, featuredGene } from "./fetch"
import { GraphQLString, GraphQLFieldConfig } from "graphql"
import {
  HomePageArtworkModuleResolvers,
  HomePageArtworkModuleDetails,
  isFollowedArtistArtworkModuleParams,
  isGenericGeneArtworkModuleParams,
  isFollowedGeneArtworkModuleParams,
  isRelatedArtistArtworkModuleParams,
} from "./types"
import { ResolverContext } from "types/graphql"

const moduleTitle: HomePageArtworkModuleResolvers<string> = {
  active_bids: () => "Your Active Bids",
  current_fairs: ({ fairsLoader }) => {
    return featuredFair(fairsLoader).then((fair) => fair && fair.name)
  },
  followed_artist: ({ artistLoader }, params) => {
    if (!isFollowedArtistArtworkModuleParams(params)) return null
    return artistLoader(params.followed_artist_id).then(
      (artist) => artist && artist.name
    )
  },
  followed_artists: () => "New Works by Artists You Follow",
  followed_galleries: () => "Works from Galleries You Follow",
  generic_gene: (_context, params) => {
    if (isGenericGeneArtworkModuleParams(params)) {
      return params.title
    }
    return null
  },
  genes: ({ followedGenesLoader }, params) => {
    if (isFollowedGeneArtworkModuleParams(params)) {
      return params.gene.name
    }
    // Backward compatibility for Force.
    return featuredGene(followedGenesLoader).then((fetchedGene) => {
      if (fetchedGene) {
        return fetchedGene.name
      }
      return null
    })
  },
  live_auctions: ({ salesLoader }) => {
    return featuredAuction(salesLoader).then(
      (auction) => auction && auction.name
    )
  },
  popular_artists: () => "Works by Popular Artists",
  recommended_works: () => "Recommended Works for You",
  related_artists: ({ artistLoader }, params) => {
    if (!isRelatedArtistArtworkModuleParams(params)) return null
    return artistLoader(params.related_artist_id).then(
      (artist) => artist && artist.name
    )
  },
  saved_works: () => "Recently Saved",
  similar_to_saved_works: () => "Similar to Works You’ve Saved",
  recently_viewed_works: () => "Recently Viewed",
  similar_to_recently_viewed: () => "Similar to Works You’ve Viewed",
}

const Title: GraphQLFieldConfig<
  HomePageArtworkModuleDetails,
  ResolverContext
> = {
  type: GraphQLString,
  resolve: ({ key, display, params }, _options, context) => {
    if (display) return moduleTitle[key](context, params)
  },
}

export default Title
