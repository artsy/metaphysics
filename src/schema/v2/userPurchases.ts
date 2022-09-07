import { connectionDefinitions } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { GraphQLString, Thunk, GraphQLFieldConfigMap } from "graphql"
import { IDFields } from "./object_identification"
import { ArtworkType } from "./artwork"

export const edgeFields: Thunk<GraphQLFieldConfigMap<
  any,
  ResolverContext
>> = () => ({
  ...IDFields,
  ownerType: { type: GraphQLString, resolve: ({ owner_type }) => owner_type },
})

export const UserPurchaseConnection = connectionDefinitions({
  name: "UserPurchase",
  nodeType: ArtworkType,
  edgeFields: edgeFields,
})
