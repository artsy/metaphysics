import { GraphQLObjectType, GraphQLString, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

const DimensionsType = new GraphQLObjectType<any, ResolverContext>({
  name: "dimensions",
  fields: {
    in: {
      type: GraphQLString,
    },
    cm: {
      type: GraphQLString,
    },
  },
})

const Dimensions: GraphQLFieldConfig<void, ResolverContext> = {
  type: DimensionsType,
}

export default Dimensions
