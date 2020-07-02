import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import Gene from "./gene"
import { ResolverContext } from "types/graphql"
import { SlugAndInternalIDFields } from "./object_identification"
import Image from "schema/v2/image"

const FeaturedGeneLinkType = new GraphQLObjectType<any, ResolverContext>({
  name: "FeaturedGeneLink",
  description:
    "An illustrated link chosen to highlight a Gene from a given GeneFamily",
  fields: {
    internalID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },
    href: {
      type: new GraphQLNonNull(GraphQLString),
    },
    image: Image,
  },
})

export const GeneFamilyType = new GraphQLObjectType<any, ResolverContext>({
  name: "GeneFamily",
  description: "A user-facing thematic grouping of Genes",
  fields: {
    ...SlugAndInternalIDFields,
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    genes: {
      type: new GraphQLList(Gene.type),
    },

    /*
     * This translates the OrderedSet/OrderedItem-based implementation
     * into a more domain-specific "FeaturedGeneLink"
     */
    featuredGeneLinks: {
      type: new GraphQLList(FeaturedGeneLinkType),
      resolve: async (family, _args, { setsLoader, setItemsLoader }) => {
        const args = {
          key: "browse:gene-category",
          size: 20,
        }
        const { body: allSets } = await setsLoader(args)
        const setForFamily = allSets.find((set) => set.name === family.name)
        const { body: itemsForFamily } = await setItemsLoader(setForFamily.id)
        return itemsForFamily
      },
    },
  },
})

const GeneFamily: GraphQLFieldConfig<void, ResolverContext> = {
  type: GeneFamilyType,
}

export default GeneFamily
