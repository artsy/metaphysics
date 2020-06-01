import initials from "./fields/initials"
import Image from "./image"
import { GraphQLString, GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "./object_identification"

export const FeaturedLinkType = new GraphQLObjectType<any, ResolverContext>({
  name: "FeaturedLink",
  fields: {
    ...InternalIDFields,
    id: {
      type: GraphQLString,
      description: InternalIDFields.id.description,
      resolve: ({ href }) => href.split("/").pop().split("?")[0],
    },
    href: {
      type: GraphQLString,
    },
    image: Image,
    initials: initials("title"),
    subtitle: {
      type: GraphQLString,
    },
    title: {
      type: GraphQLString,
    },
  },
})

const FeaturedLink: GraphQLFieldConfig<void, ResolverContext> = {
  type: FeaturedLinkType,
}

export default FeaturedLink
