import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { assign, create } from "lodash"
import { ArtistType } from "schema/v1/artist/index"
import { TrendingArtistsType } from "schema/v1/artists/trending"
import { FairType } from "schema/v1/fair"
import { GeneType } from "schema/v1/gene"
import { FollowArtistsType } from "schema/v1/me/follow_artists"
import { SaleType } from "schema/v1/sale/index"
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

export const HomePageModuleContextFairType = create(FairType, {
  name: "HomePageModuleContextFair",
  isTypeOf: ({ context_type }) => context_type === "Fair",
})

export const HomePageModuleContextSaleType = create(SaleType, {
  name: "HomePageModuleContextSale",
  isTypeOf: ({ context_type }) => context_type === "Sale",
})

export const HomePageModuleContextGeneType = create(GeneType, {
  name: "HomePageModuleContextGene",
  isTypeOf: ({ context_type }) => context_type === "Gene",
})

export const HomePageModuleContextTrendingType = create(TrendingArtistsType, {
  name: "HomePageModuleContextTrending",
  isTypeOf: ({ context_type }) => context_type === "Trending",
})

export const HomePageModuleContextFollowArtistsType = create(
  FollowArtistsType,
  {
    name: "HomePageModuleContextFollowArtists",
    isTypeOf: ({ context_type }) => context_type === "FollowArtists",
  }
)

export const HomePageModuleContextRelatedArtistType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "HomePageModuleContextRelatedArtist",
  fields: () => ({
    artist: {
      type: ArtistType,
    },
    based_on: {
      type: ArtistType,
    },
  }),
  isTypeOf: ({ context_type }) => context_type === "RelatedArtist",
})

export const HomePageModuleContextFollowedArtistType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "HomePageModuleContextFollowedArtist",
  fields: () => ({
    artist: {
      type: ArtistType,
    },
  }),
  isTypeOf: ({ context_type }) => context_type === "FollowedArtist",
})

// interface Params {
//   followed_artist_id?: string
//   related_artist_id?: string
//   gene?: {} // TODO: Not sure what this type is
//   gene_id?: string
// }

export const moduleContext: HomePageArtworkModuleResolvers = {
  popular_artists: ({ deltaLoader }) => {
    return popularArtists(deltaLoader).then((trending) => {
      return assign({}, trending, { context_type: "Trending" })
    })
  },
  active_bids: () => null,
  followed_artists: ({ followedArtistsLoader }) => {
    if (!followedArtistsLoader) return null
    return followedArtistsLoader({ size: 9, page: 1 }).then(({ body }) => {
      return assign({}, body, { context_type: "FollowArtists" })
    })
  },
  followed_galleries: () => null,
  saved_works: () => null,
  recently_viewed_works: () => null,
  similar_to_recently_viewed: () => null,
  similar_to_saved_works: () => null,
  recommended_works: () => null,
  live_auctions: ({ salesLoader }) => {
    return featuredAuction(salesLoader).then((sale) => {
      return assign({}, sale, { context_type: "Sale" })
    })
  },
  current_fairs: ({ fairsLoader }) => {
    return featuredFair(fairsLoader).then((fair) => {
      return assign({}, fair, { context_type: "Fair" })
    })
  },
  followed_artist: ({ artistLoader }, params) => {
    if (!isFollowedArtistArtworkModuleParams(params)) return null
    return artistLoader(params.followed_artist_id).then((artist) => {
      return assign(
        {},
        {
          context_type: "FollowedArtist",
          artist,
        }
      )
    })
  },
  related_artists: ({ artistLoader }, params) => {
    if (!isRelatedArtistArtworkModuleParams(params)) return null
    return Promise.all([
      artistLoader(params.related_artist_id),
      artistLoader(params.followed_artist_id),
    ]).then(([related_artist, follow_artist]) => {
      return assign(
        {},
        {
          context_type: "RelatedArtist",
          based_on: follow_artist,
          artist: related_artist,
        }
      )
    })
  },
  genes: ({ followedGenesLoader }, params) => {
    if (isFollowedGeneArtworkModuleParams(params)) {
      return assign({}, params.gene, { context_type: "Gene" })
    }
    // Backward compatibility for Force.
    return featuredGene(followedGenesLoader).then((fetchedGene) => {
      return assign({}, fetchedGene, { context_type: "Gene" })
    })
  },
  generic_gene: ({ geneLoader }, params) => {
    if (!isGenericGeneArtworkModuleParams(params)) return null
    return geneLoader(params.gene_id).then((gene) => {
      return assign({}, gene, { context_type: "Gene" })
    })
  },
}

const Context: GraphQLFieldConfig<
  { key: string; params: HomePageArtworkModuleDetails["params"] },
  ResolverContext
> = {
  type: new GraphQLUnionType({
    name: "HomePageModuleContext",
    types: [
      HomePageModuleContextFairType,
      HomePageModuleContextFollowArtistsType,
      HomePageModuleContextFollowedArtistType,
      HomePageModuleContextGeneType,
      HomePageModuleContextRelatedArtistType,
      HomePageModuleContextSaleType,
      HomePageModuleContextTrendingType,
    ],
  }),
  resolve: ({ key, params }, _options, context) => {
    return moduleContext[key](context, params)
  },
}

export default Context
