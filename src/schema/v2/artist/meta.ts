import { stripTags, truncate, markdownToText } from "lib/helpers"
import { compact } from "lodash"
import { GraphQLString, GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

export const metaName = (artist) => {
  if (artist.name) return stripTags(artist.name)
  return "Unnamed Artist"
}

export const formatDescription = (description: string, blurb?: string) => {
  return truncate(compact([description, blurb]).join("."), 157)
}

const ArtistMetaType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistMeta",
  fields: {
    artworksDescription: {
      type: GraphQLString,
      resolve: (artist) => {
        const blurb = artist.blurb.length
          ? markdownToText(artist.blurb)
          : undefined

        return formatDescription(
          `Discover and purchase ${metaName(
            artist
          )}’s artworks, available for sale. Browse our selection of paintings, prints, and sculptures by the artist, and find art you love.`,
          blurb
        )
      },
    },
    artworksTitle: {
      type: GraphQLString,
      resolve: (artist) => {
        return `${metaName(artist)} - Artworks for Sale & More | Artsy`
      },
    },
    auctionDescription: {
      type: GraphQLString,
      resolve: (artist) => {
        return `Find out about ${metaName(
          artist
        )}’s auction history, past sales, and current market value. Browse Artsy’s Price Database for recent auction results from the artist.`
      },
    },
    auctionTitle: {
      type: GraphQLString,
      resolve: (artist) => {
        return `${metaName(artist)} - Auction Results and Sales Data | Artsy`
      },
    },
    description: {
      type: GraphQLString,
      resolve: (artist) => {
        const blurb = artist.blurb.length
          ? markdownToText(artist.blurb)
          : undefined

        return formatDescription(
          `Explore ${metaName(
            artist
          )}'s biography, achievements, artworks, auction results, and shows on Artsy.`,
          blurb
        )
      },
    },
    title: {
      type: GraphQLString,
      resolve: (artist) => {
        return `${metaName(artist)} - Biography, Shows, Articles & More | Artsy`
      },
    },
  },
})

const Meta: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtistMetaType,
  resolve: (x) => x,
}

export default Meta
