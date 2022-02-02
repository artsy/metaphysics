import {
  GraphQLObjectType,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { markdown } from "./fields/markdown"
import { SlugAndInternalIDFields } from "./object_identification"

const StaticContentType = new GraphQLObjectType<any, ResolverContext>({
  name: "StaticContent",
  fields: {
    ...SlugAndInternalIDFields,
    name: {
      type: GraphQLString,
    },
    content: markdown(),
  },
})

const StaticContent: GraphQLFieldConfig<void, ResolverContext> = {
  type: StaticContentType,
  description: "Content for a specific page or view",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or id for the view",
    },
  },
  resolve: (_root, { id }, { staticContentLoader }) => {
    return staticContentLoader(id)
  },
}

export default StaticContent
