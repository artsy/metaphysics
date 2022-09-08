import { connectionDefinitions } from "graphql-relay"
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

export const UserInterestConnection = connectionDefinitions({
  name: "UserInterest",
  nodeType: userInterestInterestUnion,
  edgeFields: edgeFields,
}).connectionType
