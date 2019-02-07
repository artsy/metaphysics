import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLID,
  GraphQLNonNull,
} from "graphql"
import { toGlobalId } from "graphql-relay"
import { Searchable } from "schema/searchable"
import { NodeInterface, GravityIDFields } from "schema/object_identification"

export const SearchableItem = new GraphQLObjectType({
  name: "SearchableItem",
  interfaces: [NodeInterface, Searchable],
  fields: {
    ...GravityIDFields,
    __id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: item => toGlobalId("SearchableItem", item._id),
    },
    displayLabel: {
      type: GraphQLString,
      resolve: item => item.display,
    },
    imageUrl: {
      type: GraphQLString,
      resolve: item => item.image_url,
    },
    href: {
      type: GraphQLString,
      resolve: item => {
        switch (item.label) {
          case "Artwork":
            return `/artwork/${item.id}`
          case "Artist":
            return `/artist/${item.id}`
          default:
            return ""
        }
      },
    },
    searchableType: {
      type: GraphQLString,
      resolve: item => item.label,
    },
  },
})
