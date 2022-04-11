import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { GeneType } from "schema/v2/gene"

const ArtworkMedium = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworkMedium",
  description:
    'Collection of fields that describe medium type, such as _Painting_. (This field is also commonly referred to as just "medium", but should not be confused with the artwork attribute called `medium`.)',
  fields: {
    name: {
      type: GraphQLString,
      description: "Shortest form of medium type display",
    },
    longDescription: {
      type: GraphQLString,
      description: "Long descriptive phrase",
      resolve: ({ long_description }) => {
        return long_description
      },
    },
    filterGene: {
      type: GeneType,
      description:
        "The medium gene that corresponds to this medium type. Used for filtering purposes on our frontend, e.g. in artwork grids.",
      resolve: async (parent, _args, { geneLoader }) => {
        const { mediumFilterGeneSlug } = parent
        if (!mediumFilterGeneSlug) return null
        return await geneLoader(mediumFilterGeneSlug)
      },
    },
  },
})

export default ArtworkMedium
