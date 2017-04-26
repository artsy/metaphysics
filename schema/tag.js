// @flow
import type { GraphQLFieldConfig } from "graphql"
import gravity from "../lib/loaders/gravity"
import cached from "./fields/cached"
import Image from "./image"
import { GravityIDFields } from "./object_identification"
import { GraphQLObjectType, GraphQLString, GraphQLInt } from "graphql"

const TagType = new GraphQLObjectType({
  name: "Tag",
  fields: {
    ...GravityIDFields,
    cached,
    description: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
      resolve: ({ id }) => `gene/${id}`,
    },
    image: Image,
    count: {
      type: GraphQLInt,
    },
  },
})

const Tag: GraphQLFieldConfig<TagType, *> = {
  type: TagType,
  args: {
    id: {
      description: "The slug or ID of the Tag",
    },
  },
  resolve: (root, { id }) => gravity(`gene/${id}`),
}

export default Tag
