import { stripTags, markdownToText } from "lib/helpers"
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

const ArtistPageEnumType = new GraphQLEnumType({
  name: "ArtistPage",
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
      resolve: ({ artist, page }) => {
        const blurb = artist.blurb?.length
          ? ` ${markdownToText(artist.blurb).slice(0, 70)}`
          : ""

        switch (page) {
          case "ABOUT":
            return `Explore ${metaName(
              artist
            )}’s biography, achievements, artworks, auction results, and shows on Artsy.${blurb}`
          case "ARTWORKS":
            return `Discover and purchase ${metaName(
              artist
            )}’s artworks, available for sale. Browse our selection of paintings, prints, and sculptures by the artist, and find art you love.`
          case "AUCTION_RESULTS":
            return `Find out about ${metaName(
              artist
            )}’s auction history, past sales, and current market value. Browse Artsy’s Price Database for recent auction results from the artist.`
        }
      },
    },
    title: {
      type: GraphQLString,
      resolve: ({ artist, page }) => {
        switch (page) {
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
    page: { type: ArtistPageEnumType, defaultValue: "ABOUT" },
  },
  resolve: (artist, { page }) => {
    return { artist, page }
  },
}

export default Meta
