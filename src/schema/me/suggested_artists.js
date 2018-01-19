import { ArtistType } from "schema/artist"
import { GraphQLList } from "graphql"
import { SuggestedArtistsArgs } from "schema/me/suggested_artists_args"

export default {
  type: new GraphQLList(ArtistType),
  description:
    "A list of the current user’s suggested artists, based on a single artist",
  args: SuggestedArtistsArgs,
  resolve: (
    root,
    options,
    request,
    { rootValue: { suggestedArtistsLoader } }
  ) => {
    if (!suggestedArtistsLoader) return null
    if (!options.artist_id) return null
    return suggestedArtistsLoader(options).then(({ body }) => body)
  },
}
