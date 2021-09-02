import {
  GraphQLList,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  extenralAuctionHouseType,
  Response as AuctionHousesResponse,
} from "./ExternalAuctionHouse"
import { externalFairType, Response as FairsResponse } from "./ExternalFair"
import {
  externalGalleryType,
  Response as GalleriesResponse,
} from "./ExternalGallery"

const externalType = new GraphQLObjectType<
  Record<never, never>,
  ResolverContext
>({
  name: "External",
  fields: {
    auctionHouses: {
      args: {
        term: { type: GraphQLString },
        size: { type: GraphQLInt },
      },
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(extenralAuctionHouseType))
      ),
      resolve: async (
        _parent,
        { term, size }: { term?: string; size?: number },
        { galaxyAuctionHousesLoader }
      ) => {
        const res: AuctionHousesResponse = await galaxyAuctionHousesLoader({
          term,
          size,
        })
        return res._embedded.auction_houses
      },
    },
    fairs: {
      args: {
        term: { type: GraphQLString },
        size: { type: GraphQLInt },
      },
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(externalFairType))
      ),
      resolve: async (
        _parent,
        { term, size }: { term?: string; size?: number },
        { galaxyFairsLoader }
      ) => {
        const res: FairsResponse = await galaxyFairsLoader({ term, size })
        return res._embedded.fairs
      },
    },
    galleries: {
      args: {
        term: { type: GraphQLString },
        size: { type: GraphQLInt },
        artsyOnly: {
          type: GraphQLBoolean,
          description: "Limit results to only galleries on Artsy",
          defaultValue: true,
        },
      },
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(externalGalleryType))
      ),
      resolve: async (
        _parent,
        {
          term,
          size,
          artsyOnly,
        }: { term?: string; size?: number; artsyOnly?: boolean },
        { galaxyGalleriesLoader }
      ) => {
        const res: GalleriesResponse = await galaxyGalleriesLoader({
          term,
          size,
          artsy_only: artsyOnly,
        })
        return res._embedded.galleries
      },
    },
  },
})

export const externalField: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLNonNull(externalType),
  description: "A namespace external partners (provided by Galaxy)",
  resolve: (_root, _options, _context) => {
    return {}
  },
}
