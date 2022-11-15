import {
  userInterestInterestUnion,
  UserInterest,
  userInterestCategoryEnum,
} from "./me/userInterests"
import { ResolverContext } from "types/graphql"
import {
  GraphQLString,
  Thunk,
  GraphQLFieldConfigMap,
  GraphQLNonNull,
  GraphQLBoolean,
} from "graphql"
import { IDFields } from "./object_identification"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"

export const edgeFields: Thunk<GraphQLFieldConfigMap<
  UserInterest,
  ResolverContext
>> = () => ({
  ...IDFields,
  body: { type: GraphQLString },
  category: { type: new GraphQLNonNull(userInterestCategoryEnum) },
  createdByAdmin: {
    type: new GraphQLNonNull(GraphQLBoolean),
    resolve: ({ owner_type }) => owner_type === "UserSaleProfile",
  },
})

export const UserInterestConnection = connectionWithCursorInfo({
  name: "UserInterest",
  nodeType: userInterestInterestUnion,
  edgeFields: edgeFields,
}).connectionType
