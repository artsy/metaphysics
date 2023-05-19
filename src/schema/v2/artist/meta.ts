import { stripTags, truncate, markdownToText } from "lib/helpers"
import { compact } from "lodash"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLFieldConfig,
  GraphQLEnumType,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const metaName = (artist) => {
  if (artist.name) return stripTags(artist.name)
  return "Unnamed Artist"
}

export const formatDescription = (description: string, blurb?: string) => {
  return truncate(compact([description, blurb]).join("."), 157)
}

const ArtistTabEnumType = new GraphQLEnumType({
  name: "ArtistTab",
  values: {
    ABOUT: { value: "ABOUT" },
    ARTWORKS: { value: "ARTWORKS" },
    AUCTION_RESULTS: { value: "AUCTION_RESULTS" },
  },
})

const ArtistMetaType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistMeta",
  fields: {
    description: {
      type: GraphQLString,
      resolve: ({ artist, tab }) => {
        const blurb = artist.blurb.length
          ? markdownToText(artist.blurb)
          : undefined

        switch (tab) {
          case "ABOUT":
            return formatDescription(
              `Explore ${metaName(
                artist
              )}'s biography, achievements, artworks, auction results, and shows on Artsy.`,
              blurb
            )
          case "ARTWORKS":
            return formatDescription(
              `Discover and purchase ${metaName(
                artist
              )}’s artworks, available for sale. Browse our selection of paintings, prints, and sculptures by the artist, and find art you love.`,
              blurb
            )
          case "AUCTION_RESULTS":
            return `Find out about ${metaName(
              artist
            )}’s auction history, past sales, and current market value. Browse Artsy’s Price Database for recent auction results from the artist.`
        }
      },
    },
    title: {
      type: GraphQLString,
      resolve: ({ artist, tab }) => {
        switch (tab) {
          case "ABOUT":
            return `${metaName(
              artist
            )} - Biography, Shows, Articles & More | Artsy`
          case "ARTWORKS":
            return `${metaName(artist)} - Artworks for Sale & More | Artsy`
          case "AUCTION_RESULTS":
            return `${metaName(
              artist
            )} - Auction Results and Sales Data | Artsy`
        }
      },
    },
  },
})

const Meta: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtistMetaType,
  args: {
    tab: { type: ArtistTabEnumType },
  },
  resolve: (artist, { tab }) => {
    return { artist, tab }
  },
}

export default Meta
