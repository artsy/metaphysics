import { stripTags, truncate, markdownToText } from "lib/helpers"
import { compact } from "lodash"
import { GraphQLString, GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import artistBio from "./seo_test/bio_insight_test_group"
import artistSale from "./seo_test/for_sale_test_group"

export const metaName = artist => {
  if (artist.name) return stripTags(artist.name)
  return "Unnamed Artist"
}

export const metaTitle = artist => {
  const count = artist.published_artworks_count
  const name = metaName(artist)

  if (artistBio.test.includes(artist.id)) {
    return `${name} - Art, Bio, Insights - Artsy`
  }
  if (artistSale.test.includes(artist.id)) {
    return `${name} - For Sale on Artsy`
  }
  return `${metaName(artist)} - ${count} Artworks, Bio & Shows on Artsy`
}

const ArtistMetaType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistMeta",
  fields: {
    description: {
      type: GraphQLString,
      resolve: artist => {
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
        return metaTitle(artist)
      },
    },
  },
})

const Meta: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtistMetaType,
  resolve: x => x,
}

export default Meta
