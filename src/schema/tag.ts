import cached from "./fields/cached"
import Image from "./image"
import { GravityIDFields, NodeInterface } from "./object_identification"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLFieldConfig,
} from "graphql"
import filterArtworks from "./filter_artworks"
import { ResolverContext } from "types/graphql"
import { includesFieldsOtherThanSelectionSet } from "lib/hasFieldSelection"

const TagType = new GraphQLObjectType<any, ResolverContext>({
  name: "Tag",
  interfaces: [NodeInterface],
  fields: () => {
    return {
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
      filtered_artworks: filterArtworks("tag_id"),
    }
  },
})

const Tag: GraphQLFieldConfig<void, ResolverContext> = {
  type: TagType,
  args: {
    id: {
      description: "The slug or ID of the Tag",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_root, { id }, { tagLoader }, info) => {
    // If you are just making an artworks call ( e.g. if paginating )
    // do not make a Gravity call for the gene data.
    const blacklistedFields = ["filtered_artworks", "id", "__id"]
    if (includesFieldsOtherThanSelectionSet(info, blacklistedFields)) {
      return tagLoader(id).then(tag => {
        return Object.assign(tag, { _type: "Tag" }, {})
      })
    }

    // The family and browsable are here so that the type system's `isTypeOf`
    // resolves correctly when we're skipping gravity data
    return { id, _type: "Tag" }
  },
}

export default Tag
