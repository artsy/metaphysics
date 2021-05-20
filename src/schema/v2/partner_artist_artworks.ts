import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "./artwork"
import { connectionWithCursorInfo } from "./fields/pagination"
import { PartnerArtistType } from "./partner_artist"

const PartnerArtistArtworksSort = {
  type: new GraphQLEnumType({
    name: "PartnerArtistArtworksSort",
    values: {
      POSITION_ASC: {
        value: "position",
      },
      POSITION_DESC: {
        value: "-position",
      },
    },
  }),
}

const PartnerArtistArtworksType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerArtistArtworks",
  fields: () => {
    return {
      position: {
        type: GraphQLInt,
      },
      id: {
        type: GraphQLString,
      },
      artwork: {
        type: ArtworkType,
        resolve: ({ artwork }) => artwork,
      },
      partnerArtist: {
        type: PartnerArtistType,
        resolve: ({ partner_artist }) => partner_artist,
      },
    }
  },
})

export const PartnerArtistArtworksConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: connectionWithCursorInfo({
    nodeType: PartnerArtistArtworksType,
  }).connectionType,
  description: "A PartnerArtist artworks connection",
  args: pageable({
    sort: PartnerArtistArtworksSort,
  }),
  resolve: (
    { partner: { id: partnerID }, artist: { id: artistID } },
    args,
    { partnerArtistArtworksLoader }
  ) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const gravityArgs = {
      total_count: true,
      sort: args.sort,
      page,
      size,
    }

    return partnerArtistArtworksLoader(
      { partnerID, artistID },
      gravityArgs
    ).then(({ body, headers }) => {
      const totalCount = parseInt(headers["x-total-count"] || "0", 10)

      return {
        totalCount,
        ...connectionFromArraySlice(body, args, {
          arrayLength: totalCount,
          sliceStart: offset,
        }),
      }
    })
  },
}
