import cached from "./fields/cached"
import Image from "./image"
import { GravityIDFields, NodeInterface } from "./object_identification"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
} from "graphql"
import filterArtworks from "./filter_artworks"
import { queriedForFieldsOtherThanBlacklisted } from "lib/helpers"

const TagType = new GraphQLObjectType({
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

const Tag = {
  type: TagType,
  args: {
    id: {
      description: "The slug or ID of the Tag",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (
    root,
    { id },
    request,
    { fieldNodes, rootValue: { tagLoader } }
  ) => {
    // If you are just making an artworks call ( e.g. if paginating )
    // do not make a Gravity call for the gene data.
    const blacklistedFields = ["filtered_artworks", "id", "__id"]
    if (queriedForFieldsOtherThanBlacklisted(fieldNodes, blacklistedFields)) {
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
