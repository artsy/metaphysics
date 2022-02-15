import { IDFields } from "./object_identification"
import { GraphQLString, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { ImageType } from "./image"
import { markdown } from "schema/v2/fields/markdown"

const AuthorType = new GraphQLObjectType<any, ResolverContext>({
  name: "Author",
  fields: {
    ...IDFields,
    name: {
      type: GraphQLString,
    },
    image: {
      type: ImageType,
      resolve: ({ image_url }) => {
        if (!image_url) return null
        return { image_url }
      },
    },
    bio: markdown(({ bio }) => bio),
    twitterHandle: {
      type: GraphQLString,
      resolve: ({ twitter_handle }) => twitter_handle,
    },
  },
})

export default AuthorType
