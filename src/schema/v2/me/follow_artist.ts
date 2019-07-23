import { GraphQLString, GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ArtistType } from "schema/v2/artist/index"
import PopularArtists from "schema/v2/artists/popular"
import { ResolverContext } from "types/graphql"

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "FollowArtist",
  description: "Follow (or unfollow) an artist",
  inputFields: {
    artist_id: {
      type: GraphQLString,
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
    popular_artists: PopularArtists,
  },
  mutateAndGetPayload: (
    { artist_id, unfollow },
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
