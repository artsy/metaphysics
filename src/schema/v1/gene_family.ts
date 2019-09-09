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

export const GeneFamilyType = new GraphQLObjectType<any, ResolverContext>({
  name: "GeneFamily",
  fields: {
    ...SlugAndInternalIDFields,
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    genes: {
      type: new GraphQLList(Gene.type),
    },
  },
})

const GeneFamily: GraphQLFieldConfig<void, ResolverContext> = {
  type: GeneFamilyType,
}

export default GeneFamily
