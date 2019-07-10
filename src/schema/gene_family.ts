import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import Gene from "./gene"
import { ResolverContext } from "types/graphql"
import { GravityIDFields } from "./object_identification"

const GeneFamilyType = new GraphQLObjectType<any, ResolverContext>({
  name: "GeneFamily",
  fields: {
    ...GravityIDFields,
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
