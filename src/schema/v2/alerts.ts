import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { IDFields } from "./object_identification"
import GraphQLJSON from "graphql-type-json"

export const AlertType = new GraphQLObjectType<any, ResolverContext>({
  name: "Alert",
  fields: {
    ...IDFields,
    priceRange: {
      type: GraphQLString,
      resolve: ({ price_range }) => price_range,
    },
    formattedPriceRange: {
      type: GraphQLString,
      resolve: ({ formatted_price_range }) => formatted_price_range,
    },
    totalUserSearchCriteriaCount: {
      type: GraphQLInt,
      resolve: ({ total_user_search_criteria_count }) =>
        total_user_search_criteria_count,
    },
    materialsTerms: {
      type: GraphQLString,
      resolve: ({ materials_terms }) => materials_terms,
    },
    attributionClass: {
      type: GraphQLString,
      resolve: ({ attribution_class }) => attribution_class,
    },
    hasRecentlyEnabledUserSearchCriteria: {
      type: GraphQLBoolean,
      resolve: ({ has_recently_enabled_user_search_criteria }) =>
        has_recently_enabled_user_search_criteria,
    },
    additionalGeneNames: {
      type: GraphQLString,
      resolve: ({ additional_gene_names }) => additional_gene_names,
    },
    // Summary is a generic/dynamic JSON object.
    // TODO: This should probably be structured.
    summary: {
      type: GraphQLJSON,
    },
  },
})

export const AlertsConnectionType = connectionWithCursorInfo({
  name: "Alert",
  nodeType: AlertType,
}).connectionType
