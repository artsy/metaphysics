import { GraphQLFieldConfig, GraphQLObjectType } from "graphql"
import { connectionDefinitions } from "graphql-relay"
import { pageable } from "relay-cursor-paging"
import { params } from "schema/v1/home/add_generic_genes"
import { InternalIDFields } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"

export const AuctionResultsByFollowedArtistsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "AuctionResultsByFollowedArtists",
  description: "TODO",
  fields: () => ({
    ...InternalIDFields,
  }),
})

const AuctionResultsByFollowedArtists: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: connectionDefinitions({ nodeType: AuctionResultsByFollowedArtistsType })
    .connectionType,
  args: pageable({}),
  description: "A list of the current user’s inquiry requests",
  resolve: async (_root, options, { followedArtistsLoader }) => {
    if (!followedArtistsLoader) return null

    const gravityArgs = {
      size: 50,
      offset: 0,
      total_count: false,
      ...params,
    }
    const { body: followedArtists } = await followedArtistsLoader(gravityArgs)

    console.log(followedArtists.map((a) => a.id))

    // TODO query auction results by artist ids

    //  option 1. figure out how to do a call to diffusion graphql endpoint hereby
    //  option 2. create a rest endpoint in diffusion and call it here with a loader

    // const { limit: size, offset } = getPagingParameters(options)

    return null

    // .then(({ body, headers }) => {
    //   return connectionFromArraySlice(body, connectionOptions, {
    //     arrayLength: parseInt(headers["x-total-count"] || "0", 10),
    //     sliceStart: offset,
    //   })
    // })
  },
}

export default AuctionResultsByFollowedArtists
