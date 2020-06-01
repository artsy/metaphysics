import { stripTags, truncate, markdownToText } from "lib/helpers"
import { compact } from "lodash"
import { GraphQLString, GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

export const metaName = (artist) => {
  if (artist.name) return stripTags(artist.name)
  return "Unnamed Artist"
}

const ArtistMetaType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistMeta",
  fields: {
    description: {
      type: GraphQLString,
      resolve: (artist) => {
        const blurb = artist.blurb.length
          ? markdownToText(artist.blurb)
          : undefined

        const description = compact([
          `Find the latest shows, biography, and artworks for sale by ${metaName(
            artist
          )}`,
          blurb,
        ]).join(". ")
        return truncate(description, 157)
      },
    },
    title: {
      type: GraphQLString,
      resolve: (artist) => {
        const count = artist.published_artworks_count
        return `${metaName(artist)} - ${count} Artworks, Bio & Shows on Artsy`
      },
    },
  },
})

const Meta: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtistMetaType,
  resolve: (x) => x,
}

export default Meta
