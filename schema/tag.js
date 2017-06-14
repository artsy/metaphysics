import gravity from "lib/loaders/gravity"
import cached from "./fields/cached"
import Image from "./image"
import { GravityIDFields } from "./object_identification"
import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLNonNull } from "graphql"

const TagType = new GraphQLObjectType({
  name: "Tag",
  fields: {
    ...GravityIDFields,
    cached,
    description: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
      resolve: ({ id }) => `tag/${id}`,
    },
    image: Image,
    count: {
      type: GraphQLInt,
    },
  },
})

const Tag = {
  type: TagType,
  args: {
    id: {
      description: "The slug or ID of the Tag",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (root, { id }) => gravity(`tag/${id}`),
}

export default Tag
