import {
  GraphQLList,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLNonNull,
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
      args: { term: { type: GraphQLString } },
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(extenralAuctionHouseType))
      ),
      resolve: async (
        _parent,
        { term }: { term?: string },
        { galaxyAuctionHousesLoader }
      ) => {
        const res: AuctionHousesResponse = await galaxyAuctionHousesLoader({
          term,
        })
        return res._embedded.auction_houses
      },
    },
    fairs: {
      args: { term: { type: GraphQLString } },
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(externalFairType))
      ),
      resolve: async (
        _parent,
        { term }: { term?: string },
        { galaxyFairsLoader }
      ) => {
        const res: FairsResponse = await galaxyFairsLoader({ term })
        return res._embedded.fairs
      },
    },
    galleries: {
      args: { term: { type: GraphQLString } },
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(externalGalleryType))
      ),
      resolve: async (
        _parent,
        { term }: { term?: string },
        { galaxyGalleriesLoader }
      ) => {
        const res: GalleriesResponse = await galaxyGalleriesLoader({ term })
        return res._embedded.galleries
      },
    },
  },
})

export const externalField: GraphQLFieldConfig<void, ResolverContext> = {
  type: externalType,
  description: "A namespace external partners (provided by Galaxy)",
  resolve: (_root, _options, _context) => {
    return {}
  },
}
