import Artist from "schema/v2/artist"
import { InternalIDFields } from "schema/v2/object_identification"
import { pageable } from "relay-cursor-paging"
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLString,
  GraphQLInt,
} from "graphql"
import { ResolverContext } from "types/graphql"
import followArtistsResolver from "lib/shared_resolvers/followedArtistsResolver"
import { connectionWithCursorInfo } from "../fields/pagination"

const FollowArtistType = new GraphQLObjectType<any, ResolverContext>({
  name: "FollowArtist",
  fields: {
    artist: {
      type: Artist.type,
    },
    auto: {
      type: GraphQLBoolean,
    },
    ...InternalIDFields,
  },
})

const FollowedArtists: GraphQLFieldConfig<void, ResolverContext> = {
  type: connectionWithCursorInfo({ nodeType: FollowArtistType }).connectionType,
  args: pageable({
    fairID: { type: GraphQLString },
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
  }),
  description: "A Connection of followed artists by current user",
  resolve: (_parent, { fairID, ...connectionArgs }, context) =>
    followArtistsResolver({ fair_id: fairID }, connectionArgs, context),
}

export default FollowedArtists
