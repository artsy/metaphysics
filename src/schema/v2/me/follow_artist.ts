import { GraphQLString, GraphQLBoolean, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ArtistType } from "schema/v2/artist/index"
import { PopularArtistsField } from "schema/v2/Highlights/PopularArtists"
import { ResolverContext } from "types/graphql"
import { meType } from "./index"

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "FollowArtist",
  description: "Follow (or unfollow) an artist",
  inputFields: {
    artistID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    unfollow: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
  },
  outputFields: {
    artist: {
      type: ArtistType,
      resolve: ({ artist_id }, _options, { artistLoader }) =>
        artistLoader(artist_id),
    },
    popularArtists: PopularArtistsField,
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_root, _options, { meLoader }) => meLoader?.(),
    },
  },
  mutateAndGetPayload: (
    { artistID: artist_id, unfollow },
    { followArtistLoader, unfollowArtistLoader }
  ) => {
    if (!followArtistLoader || !unfollowArtistLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    let performAction: Promise<any>
    if (unfollow) {
      performAction = unfollowArtistLoader(artist_id)
    } else {
      performAction = followArtistLoader({ artist_id })
    }

    // FIXME: Object is possibly 'null'
    // @ts-ignore
    return performAction.then(() => ({ artist_id }))
  },
})
