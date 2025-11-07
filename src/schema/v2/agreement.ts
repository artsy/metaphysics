import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { date } from "schema/v2/fields/date"

export const AgreementType = new GraphQLObjectType<any, ResolverContext>({
  name: "Agreement",
  description: "A legal agreement requiring partner consent",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Unique ID for this agreement",
      resolve: ({ id }) => id,
    },
    content: {
      type: GraphQLString,
      description: "Agreement content in markdown format",
      resolve: ({ content }) => content,
    },
    createdAt: date(),
    deactivatedAt: date(),
    description: {
      type: GraphQLString,
      description: "Description of this agreement",
      resolve: ({ description }) => description,
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Name of this agreement",
      resolve: ({ name }) => name,
    },
    updatedAt: date(),
  }),
})

export const Agreement: GraphQLFieldConfig<void, ResolverContext> = {
  type: AgreementType,
  description: "Find an agreement by ID",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "The ID of the agreement",
    },
  },
  resolve: async (_source, { id }, { agreementLoader }) => {
    if (!agreementLoader) {
      return null
    }

    return agreementLoader(id)
  },
}
