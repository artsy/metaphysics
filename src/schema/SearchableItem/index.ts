import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLID,
  GraphQLNonNull,
} from "graphql"
import { toGlobalId } from "graphql-relay"
import { Searchable } from "schema/searchable"
import { NodeInterface, GravityIDFields } from "schema/object_identification"
import { ResolverContext } from "types/graphql"
import { SearchableItemPresenter } from "./SearchableItemPresenter"

export const SearchableItem = new GraphQLObjectType<any, ResolverContext>({
  name: "SearchableItem",
  interfaces: [NodeInterface, Searchable],
  fields: {
    ...GravityIDFields,
    __id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: item => toGlobalId("SearchableItem", item._id),
    },
    description: {
      type: GraphQLString,
      resolve: item => new SearchableItemPresenter(item).formattedDescription(),
    },
    displayLabel: {
      type: GraphQLString,
      resolve: item => item.display,
    },
    imageUrl: {
      type: GraphQLString,
      resolve: item => new SearchableItemPresenter(item).imageUrl(),
    },
    href: {
      type: GraphQLString,
      resolve: item => new SearchableItemPresenter(item).href(),
    },
    searchableType: {
      type: GraphQLString,
      deprecationReason: "Switch to use `displayType`",
      resolve: item => new SearchableItemPresenter(item).displayType(),
    },
    displayType: {
      type: GraphQLString,
      resolve: item => new SearchableItemPresenter(item).displayType(),
    },
  },
})
