import { ArtistType } from "schema/v1/artist"
import { GraphQLList, GraphQLFieldConfig } from "graphql"
import { SuggestedArtistsArgs } from "schema/v1/me/suggested_artists_args"
import { ResolverContext } from "types/graphql"

const SuggestedArtists: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(ArtistType),
  description:
    "A list of the current user’s suggested artists, based on a single artist",
  args: SuggestedArtistsArgs,
  resolve: (_root, options, { suggestedArtistsLoader }) => {
    if (!suggestedArtistsLoader) return null
    if (!options.artist_id) return null
    return suggestedArtistsLoader(options).then(({ body }) => body)
  },
}

export default SuggestedArtists
