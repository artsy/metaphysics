import { HeroUnitType } from "./HeroUnitType"
import { GraphQLString, GraphQLNonNull, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

export const heroUnit: GraphQLFieldConfig<void, ResolverContext> = {
  type: HeroUnitType,
  description: "A Hero Unit.",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the Hero Unit",
    },
  },
  resolve: async (_root, { id }, context) => {
    const { authenticatedHeroUnitLoader, heroUnitLoader } = context
    const loader = authenticatedHeroUnitLoader ?? heroUnitLoader
    const { body } = await loader(id)
    return body
  },
}
