import { GraphQLString, GraphQLNonNull, GraphQLObjectType } from "graphql"
import { IDFields } from "../object_identification"

export const AIPromptTemplateType = new GraphQLObjectType<any, any>({
  name: "AIPromptTemplate",
  fields: () => {
    return {
      ...IDFields,
      name: {
        type: new GraphQLNonNull(GraphQLString),
      },
      model: {
        type: new GraphQLNonNull(GraphQLString),
      },
      systemPrompt: {
        type: GraphQLString,
        resolve: ({ system_prompt }) => {
          return system_prompt
        },
      },
      userPrompt: {
        type: GraphQLString,
        resolve: ({ user_prompt }) => {
          return user_prompt
        },
      },
    }
  },
})
