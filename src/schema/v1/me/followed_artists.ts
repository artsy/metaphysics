import Artist from "schema/v1/artist"
import { InternalIDFields } from "schema/v1/object_identification"

import { pageable } from "relay-cursor-paging"
import { connectionDefinitions } from "graphql-relay"
import { GraphQLObjectType, GraphQLBoolean, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import followArtistsResolver from "lib/shared_resolvers/followedArtistsResolver"

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
  type: connectionDefinitions({
    nonNullable: true,
    nodeType: FollowArtistType,
  }).connectionType,
  args: pageable({}),
  description: "A Connection of followed artists by current user",
  resolve: (_parent, args, context) => followArtistsResolver({}, args, context),
}

export default FollowedArtists
