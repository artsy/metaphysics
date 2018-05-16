import { create, assign } from "lodash"
import {
  featuredAuction,
  featuredFair,
  featuredGene,
  popularArtists,
} from "./fetch"
import Fair from "schema/fair"
import Sale from "schema/sale/index"
import Gene from "schema/gene"
import Artist from "schema/artist/index"
import FollowArtists from "schema/me/follow_artists"
import Trending from "schema/artists/trending"
import { GraphQLUnionType, GraphQLObjectType } from "graphql"

export const HomePageModuleContextFairType = create(Fair.type, {
  name: "HomePageModuleContextFair",
  isTypeOf: ({ context_type }) => context_type === "Fair",
})

export const HomePageModuleContextSaleType = create(Sale.type, {
  name: "HomePageModuleContextSale",
  isTypeOf: ({ context_type }) => context_type === "Sale",
})

export const HomePageModuleContextGeneType = create(Gene.type, {
  name: "HomePageModuleContextGene",
  isTypeOf: ({ context_type }) => context_type === "Gene",
})

export const HomePageModuleContextTrendingType = create(Trending.type, {
  name: "HomePageModuleContextTrending",
  isTypeOf: ({ context_type }) => context_type === "Trending",
})

export const HomePageModuleContextFollowArtistsType = create(
  FollowArtists.type,
  {
    name: "HomePageModuleContextFollowArtists",
    isTypeOf: ({ context_type }) => context_type === "FollowArtists",
  }
)

export const HomePageModuleContextRelatedArtistType = new GraphQLObjectType({
  name: "HomePageModuleContextRelatedArtist",
  fields: () => ({
    artist: {
      type: Artist.type,
    },
    based_on: {
      type: Artist.type,
    },
  }),
  isTypeOf: ({ context_type }) => context_type === "RelatedArtist",
})

export const HomePageModuleContextFollowedArtistType = new GraphQLObjectType({
  name: "HomePageModuleContextFollowedArtist",
  fields: () => ({
    artist: {
      type: Artist.type,
    },
  }),
  isTypeOf: ({ context_type }) => context_type === "FollowedArtist",
})

export const moduleContext = {
  popular_artists: ({ rootValue: { deltaLoader } }) => {
    return popularArtists(deltaLoader).then(trending => {
      return assign({}, trending, { context_type: "Trending" })
    })
  },
  active_bids: () => null,
  followed_artists: ({ rootValue: { followedArtistsLoader } }) => {
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
  live_auctions: ({ rootValue: { salesLoader } }) => {
    return featuredAuction(salesLoader).then(sale => {
      return assign({}, sale, { context_type: "Sale" })
    })
  },
  current_fairs: ({ rootValue: { fairsLoader } }) => {
    return featuredFair(fairsLoader).then(fair => {
      return assign({}, fair, { context_type: "Fair" })
    })
  },
  followed_artist: ({ rootValue: { artistLoader }, params }) => {
    return artistLoader(params.followed_artist_id).then(artist => {
      return assign(
        {},
        {
          context_type: "FollowedArtist",
          artist,
        }
      )
    })
  },
  related_artists: ({ rootValue: { artistLoader }, params }) => {
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
  genes: ({ rootValue: { followedGenesLoader }, params: { gene } }) => {
    if (gene) {
      return assign({}, gene, { context_type: "Gene" })
    }
    // Backward compatibility for Force.
    return featuredGene(followedGenesLoader).then(fetchedGene => {
      return assign({}, fetchedGene, { context_type: "Gene" })
    })
  },
  generic_gene: ({ rootValue: { geneLoader }, params: { gene_id } }) => {
    return geneLoader(gene_id).then(gene => {
      return assign({}, gene, { context_type: "Gene" })
    })
  },
}

export default {
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
  resolve: ({ key, display, params }, options, request, { rootValue }) => {
    return moduleContext[key]({ rootValue, params: params || {} })
  },
}
