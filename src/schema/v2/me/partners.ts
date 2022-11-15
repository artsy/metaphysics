import { GraphQLFieldConfig } from "graphql/type"
import { ResolverContext } from "types/graphql"
import { Partners } from "schema/v2/partner/partners"

export const ManagedPartners: GraphQLFieldConfig<void, ResolverContext> = {
  type: Partners.type,
  description: "A list of the current user’s managed partners",
  resolve: async (_root, _option, { partnerLoader, mePartnersLoader }) => {
    const partners = await mePartnersLoader?.()
    return Promise.all(
      partners.map((partner) => partnerLoader(partner.id))
    ).catch(() => {})
  },
}
