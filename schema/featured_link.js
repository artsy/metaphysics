import initials from "./fields/initials"
import Image from "./image"
import { GraphQLString, GraphQLObjectType } from "graphql"

const FeaturedLinkType = new GraphQLObjectType({
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
  },
})

export default {
  type: FeaturedLinkType,
}
