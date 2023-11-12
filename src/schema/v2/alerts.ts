import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { IDFields } from "./object_identification"
import GraphQLJSON from "graphql-type-json"

type GravitySearchCriteriaJSON = {
  id: string
  price_range: string
  formatted_price_range: string
  materials_terms: string[]
  attribution_class: string[]
  additional_gene_names: string[]
  summary: JSON
  count_30d: number
  count_7d: number
}

const AlertType = new GraphQLObjectType<
  GravitySearchCriteriaJSON,
  ResolverContext
>({
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
      resolve: ({ count_30d }) => count_30d,
    },
    materialsTerms: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ materials_terms }) => materials_terms,
    },
    attributionClass: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ attribution_class }) => attribution_class,
    },
    hasRecentlyEnabledUserSearchCriteria: {
      type: GraphQLBoolean,
      resolve: ({ count_7d }) => count_7d > 0,
    },
    additionalGeneNames: {
      type: new GraphQLList(GraphQLString),
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
