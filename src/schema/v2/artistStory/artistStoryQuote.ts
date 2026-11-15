import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

export const ArtistStoryQuoteType = new GraphQLObjectType<
  { text: string; attribution?: string | null },
  ResolverContext
>({
  name: "ArtistStoryQuote",
  fields: {
    text: { type: new GraphQLNonNull(GraphQLString) },
    attribution: { type: GraphQLString },
  },
})

export const toQuote = ({ text, attribution }) => {
  return text?.trim() ? { text, attribution } : null
}
