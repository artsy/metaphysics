import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import Partner from "../partner/partner"

export const PartnerMatch: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(Partner.type),
  description: "A Search for Artists",
  args: {
    query: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Your search term",
    },
  },
  resolve: async (_root, { query }, { matchPartnerLoader }) => {
    if (!matchPartnerLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const partners = await matchPartnerLoader({ term: query })

    return partners
  },
}
