import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { assign } from "lodash"
import Artist from "schema/v2/artist/index"
import { TrendingArtistsType } from "schema/v2/artists/trending"
import { FairType } from "schema/v2/fair"
import { GeneType } from "schema/v2/gene"
import { SaleType } from "schema/v2/sale"
import { FollowArtistsType } from "schema/v2/me/follow_artists"
import { ResolverContext } from "types/graphql"
import {
  featuredAuction,
  featuredFair,
  featuredGene,
  popularArtists,
} from "./fetch"
import {
  HomePageArtworkModuleDetails,
  isFollowedArtistArtworkModuleParams,
  isRelatedArtistArtworkModuleParams,
  isFollowedGeneArtworkModuleParams,
  isGenericGeneArtworkModuleParams,
  HomePageArtworkModuleResolvers,
} from "./types"

export const HomePageRelatedArtistArtworkModuleType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "HomePageRelatedArtistArtworkModule",
  fields: () => ({
    artist: {
      type: Artist.type,
      resolve: ({ artist }) => artist,
    },
    basedOn: {
      type: Artist.type,
      resolve: ({ based_on }) => based_on,
    },
  }),
})

export const HomePageFollowedArtistArtworkModuleType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "HomePageFollowedArtistArtworkModule",
  fields: () => ({
    artist: {
      type: Artist.type,
      resolve: ({ artist }) => artist,
    },
  }),
})

// interface Params {
//   followed_artist_id?: string
//   related_artist_id?: string
//   gene?: {} // TODO: Not sure what this type is
//   gene_id?: string
// }

interface ContextSource {
  context_type: GraphQLObjectType<any, ResolverContext>
}

const moduleContext: HomePageArtworkModuleResolvers<ContextSource> = {
  popular_artists: async ({ deltaLoader }) => {
    const trending = (await popularArtists(deltaLoader)) as {}
    return { ...trending, context_type: TrendingArtistsType }
  },
  active_bids: () => null,
  followed_artists: async ({ followedArtistsLoader }) => {
    if (!followedArtistsLoader) return null
    const { body } = (await followedArtistsLoader({ size: 9, page: 1 })) as {
      body: {}
    }
    return { ...body, context_type: FollowArtistsType }
  },
  followed_galleries: () => null,
  saved_works: () => null,
  recently_viewed_works: () => null,
  similar_to_recently_viewed: () => null,
  similar_to_saved_works: () => null,
  recommended_works: () => null,
  live_auctions: async ({ salesLoader }) => {
    const sale = await featuredAuction(salesLoader)
    return { ...sale, context_type: SaleType }
  },
  current_fairs: ({ fairsLoader }) => {
    return featuredFair(fairsLoader).then((fair) => {
      return assign({}, fair, { context_type: FairType })
    })
  },
  followed_artist: async ({ artistLoader }, params) => {
    if (!isFollowedArtistArtworkModuleParams(params)) return null
    const artist = await artistLoader(params.followed_artist_id)
    return {
      context_type: HomePageFollowedArtistArtworkModuleType,
      artist,
    }
  },
  related_artists: ({ artistLoader }, params) => {
    if (!isRelatedArtistArtworkModuleParams(params)) return null
    return Promise.all([
      artistLoader(params.related_artist_id),
      artistLoader(params.followed_artist_id),
    ]).then(([related_artist, follow_artist]) => {
      return {
        context_type: HomePageRelatedArtistArtworkModuleType,
        based_on: follow_artist,
        artist: related_artist,
      }
    })
  },
  genes: ({ followedGenesLoader }, params) => {
    if (isFollowedGeneArtworkModuleParams(params)) {
      return { ...params.gene, context_type: GeneType }
    }
    // Backward compatibility for Force.
    return featuredGene(followedGenesLoader).then((fetchedGene) => {
      return fetchedGene && { ...fetchedGene, context_type: GeneType }
    })
  },
  generic_gene: ({ geneLoader }, params) => {
    if (!isGenericGeneArtworkModuleParams(params)) return null
    return geneLoader(params.gene_id).then((gene) => {
      return { ...gene, context_type: GeneType }
    })
  },
}

const HomePageArtworkModuleContextType = new GraphQLUnionType<ContextSource>({
  name: "HomePageArtworkModuleContext",
  types: [
    FairType,
    GeneType,
    SaleType,
    FollowArtistsType,
    TrendingArtistsType,
    HomePageFollowedArtistArtworkModuleType,
    HomePageRelatedArtistArtworkModuleType,
  ],
  resolveType: ({ context_type }, _context, _info) => context_type,
})

const Context: GraphQLFieldConfig<
  { key: string; params: HomePageArtworkModuleDetails["params"] },
  ResolverContext
> = {
  type: HomePageArtworkModuleContextType,
  resolve: ({ key, params }, _options, context) => {
    return moduleContext[key](context, params)
  },
}

export default Context
