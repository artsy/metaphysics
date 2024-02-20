import { GraphQLFieldConfig } from "graphql/type"
import { ResolverContext } from "types/graphql"
import { Partners } from "schema/v2/partner/partners"
import { GraphQLInt } from "graphql"

export const ManagedPartners: GraphQLFieldConfig<void, ResolverContext> = {
  type: Partners.type,
  description: "A list of the current user’s managed partners",
  args: {
    size: {
      type: GraphQLInt,
    },
  },
  resolve: async (_root, args, { partnerLoader, mePartnersLoader }) => {
    const partners = await mePartnersLoader?.({
      size: args.size ?? 10,
    })
    return Promise.all(partners.map((partner) => partnerLoader(partner.id)))
  },
}
