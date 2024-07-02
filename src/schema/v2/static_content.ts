import { GraphQLObjectType, GraphQLFieldConfig, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { markdown } from "./fields/markdown"
import { SlugAndInternalIDFields } from "./object_identification"
import { SpecialistBios } from "./specialistBios"

const StaticContentType = new GraphQLObjectType<any, ResolverContext>({
  name: "StaticContent",
  fields: {
    ...SlugAndInternalIDFields,
    name: {
      type: GraphQLString,
    },
    content: markdown(),
    specialistBios: SpecialistBios,
  },
})

const StaticContent: GraphQLFieldConfig<void, ResolverContext> = {
  type: StaticContentType,
  description: "Content for a specific page or view",
  args: {
    id: {
      type: GraphQLString,
      description: "The slug or id for the view",
    },
  },
  resolve: (_root, { id }, { staticContentLoader }) => {
    if (!id)
      return {
        id: "static-content",
        slug: "static-content",
      }

    return staticContentLoader(id)
  },
}

export default StaticContent
