import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields } from "./object_identification"

export const AdvisoryOpportunityType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "AdvisoryOpportunity",
  fields: () => ({
    ...IDFields,
    message: {
      type: GraphQLString,
    },
  }),
})
