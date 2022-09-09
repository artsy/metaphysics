import { connectionDefinitions } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  GraphQLString,
  Thunk,
  GraphQLFieldConfigMap,
  GraphQLFloat,
} from "graphql"
import { IDFields } from "./object_identification"
import { ArtworkType } from "./artwork"

export const edgeFields: Thunk<GraphQLFieldConfigMap<
  any,
  ResolverContext
>> = () => ({
  ...IDFields,
  ownerType: { type: GraphQLString, resolve: ({ owner_type }) => owner_type },
  salePrice: { type: GraphQLFloat, resolve: ({ sale_price }) => sale_price },
  source: { type: GraphQLString },
})

export const UserPurchasesConnection = connectionDefinitions({
  name: "UserPurchases",
  nodeType: ArtworkType,
  edgeFields: edgeFields,
}).connectionType
