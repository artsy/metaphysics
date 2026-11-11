import { GraphQLFieldConfig, GraphQLList, GraphQLNonNull } from "graphql"
import { isUnderListPath } from "lib/helpers"
import { ResolverContext } from "types/graphql"
import {
  ArtistStoryAccentColorType,
  toAccentColor,
} from "schema/v2/artistStory/artistStoryAccentColor"

export const toAccentColorOptions = (hexColors: string[] | null | undefined) =>
  (hexColors ?? []).flatMap((hex) => toAccentColor(hex) ?? [])

export const AccentColorOptions: GraphQLFieldConfig<
  { id: string },
  ResolverContext
> = {
  type: new GraphQLList(new GraphQLNonNull(ArtistStoryAccentColorType)),
  resolve: async ({ id }, _args, { artistAccentColorOptionsLoader }, info) => {
    if (!artistAccentColorOptionsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    // One Gravity call per artist, and gravity can't batch them.
    if (isUnderListPath(info)) {
      throw new Error(
        "[artist/accentColorOptions] This field cannot be queried under a list or connection " +
          "(e.g. artistsConnection); it is only supported for a single artist via artist(id:)."
      )
    }

    const hexColors = await artistAccentColorOptionsLoader({ artist_id: id })

    return toAccentColorOptions(hexColors)
  },
}
