import initials from "./fields/initials"
import Image from "./image"
import { GraphQLString, GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

const FeaturedLinkType = new GraphQLObjectType<any, ResolverContext>({
  name: "FeaturedLink",
  fields: {
    id: {
      type: GraphQLString,
      description: "Attempt to get the ID of the entity of the FeaturedLink",
      resolve: ({ href }) =>
        href
          .split("/")
          .pop()
          .split("?")[0],
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
  } as any,
})

const FeaturedLink: GraphQLFieldConfig<void, ResolverContext> = {
  type: FeaturedLinkType,
}

export default FeaturedLink
