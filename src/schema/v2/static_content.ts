import {
  GraphQLObjectType,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

const StaticContentType = new GraphQLObjectType<any, ResolverContext>({
  name: "StaticContent",
  fields: {
    name: {
      type: GraphQLString,
    },
    content: {
      type: GraphQLString,
    },
  },
})

const StaticContent: GraphQLFieldConfig<void, ResolverContext> = {
  type: StaticContentType,
  description: "Content for a specific page or view",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug for the view",
    },
  },
  resolve: (_root, { id }, { staticContentLoader }) => {
    return staticContentLoader(id)
  },
}

export default StaticContent
