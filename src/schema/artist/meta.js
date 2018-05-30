import descriptions from "./maps/artist_meta_descriptions"
import { stripTags, truncate, markdownToText } from "lib/helpers"
import { compact } from "lodash"
import { GraphQLString, GraphQLObjectType } from "graphql"

export const metaName = artist => {
  if (artist.name) return stripTags(artist.name)
  return "Unnamed Artist"
}

const ArtistMetaType = new GraphQLObjectType({
  name: "ArtistMeta",
  fields: {
    description: {
      type: GraphQLString,
      resolve: artist => {
        if (descriptions[artist.id]) {
          return descriptions[artist.id]
        }
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
      resolve: artist => {
        const count = artist.published_artworks_count
        return `${metaName(artist)} - ${count} Artworks, Bio & Shows on Artsy`
      },
    },
  },
})

export default {
  type: ArtistMetaType,
  resolve: x => x,
}
