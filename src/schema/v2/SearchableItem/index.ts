import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLID,
  GraphQLNonNull,
} from "graphql"
import { toGlobalId } from "graphql-relay"
import { Searchable } from "schema/v2/searchable"
import {
  NodeInterface,
  SlugAndInternalIDFields,
} from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"
import { SearchableItemPresenter } from "./SearchableItemPresenter"

export const SearchableItem = new GraphQLObjectType<any, ResolverContext>({
  name: "SearchableItem",
  interfaces: [NodeInterface, Searchable],
  fields: {
    ...SlugAndInternalIDFields,
    id: {
      ...SlugAndInternalIDFields.id,
      type: new GraphQLNonNull(GraphQLID),
      resolve: (item) => toGlobalId("SearchableItem", item._id),
    },
    description: {
      type: GraphQLString,
      resolve: (item) =>
        new SearchableItemPresenter(item).formattedDescription(),
    },
    displayLabel: {
      type: GraphQLString,
      resolve: (item) => item.display,
    },
    imageUrl: {
      type: GraphQLString,
      resolve: (item) => new SearchableItemPresenter(item).imageUrl(),
    },
    href: {
      type: GraphQLString,
      resolve: (item) => new SearchableItemPresenter(item).href(),
    },
    displayType: {
      type: GraphQLString,
      resolve: (item) => new SearchableItemPresenter(item).displayType(),
    },
  },
})
