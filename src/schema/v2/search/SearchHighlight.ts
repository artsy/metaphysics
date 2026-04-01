import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
} from "graphql"

export const SearchHighlightType = new GraphQLObjectType({
  name: "SearchHighlight",
  description:
    "A highlighted field from an OpenSearch query match, containing the field name and highlighted fragments with <em> tags around matched terms",
  fields: {
    field: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "The base field name that matched (e.g. name, alternate_names, artist_names, venue, description)",
    },
    fragments: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description:
        "Highlighted text fragments with <em> tags wrapping matched terms",
    },
  },
})
