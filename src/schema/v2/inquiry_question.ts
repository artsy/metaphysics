import { IDFields } from "./object_identification"
import { GraphQLNonNull, GraphQLString, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"

export const InquiryQuestionType = new GraphQLObjectType<any, ResolverContext>({
  name: "InquiryQuestion",
  fields: {
    ...IDFields,
    question: {
      type: GraphQLNonNull(GraphQLString),
    },
  },
})
