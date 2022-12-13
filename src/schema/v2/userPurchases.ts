import { ResolverContext } from "types/graphql"
import {
  GraphQLString,
  Thunk,
  GraphQLFieldConfigMap,
  GraphQLFloat,
} from "graphql"
import { IDFields } from "./object_identification"
import { ArtworkType } from "./artwork"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { date } from "./fields/date"

export const edgeFields: Thunk<GraphQLFieldConfigMap<
  any,
  ResolverContext
>> = () => ({
  ...IDFields,
  ownerType: { type: GraphQLString, resolve: ({ owner_type }) => owner_type },
  salePrice: { type: GraphQLFloat, resolve: ({ sale_price }) => sale_price },
  saleDate: date(({ sale_date }) => sale_date),
  source: { type: GraphQLString },
})

export const UserPurchasesConnection = connectionWithCursorInfo({
  name: "UserPurchases",
  nodeType: ArtworkType,
  edgeFields: edgeFields,
}).connectionType
