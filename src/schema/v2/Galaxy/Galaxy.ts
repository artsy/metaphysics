import {
  GraphQLList,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  galaxyAuctionHouseType,
  Response as AuctionHousesResponse,
} from "./GalaxyAuctionHouse"
import { galaxyFairType, Response as FairsResponse } from "./GalaxyFair"
import {
  galaxyGalleryType,
  Response as GalleriesResponse,
} from "./GalaxyGallery"

const galaxyType = new GraphQLObjectType<Record<never, never>, ResolverContext>(
  {
    name: "Galaxy",
    fields: {
      auctionHouses: {
        args: { term: { type: GraphQLString } },
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(galaxyAuctionHouseType))
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
          new GraphQLList(new GraphQLNonNull(galaxyFairType))
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
          new GraphQLList(new GraphQLNonNull(galaxyGalleryType))
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
  }
)

const Galaxy: GraphQLFieldConfig<void, ResolverContext> = {
  type: galaxyType,
  description: "A namespace external partners (provided by the Galaxy API)",
  resolve: (_root, _options, _context) => {
    return {}
  },
}

export default Galaxy
