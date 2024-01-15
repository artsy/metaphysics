import { GraphQLObjectType } from "graphql"
import { CollectorProfileType } from "schema/v2/CollectorProfile/collectorProfile"
import { ResolverContext } from "types/graphql"

export const PartnerCollectorProfileType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerCollectorProfile",
  fields: () => ({
    collectorProfile: {
      type: CollectorProfileType,
      resolve: async (
        { partnerId, collectorId },
        _args,
        { partnerCollectorProfileLoader }
      ) => {
        if (!partnerCollectorProfileLoader) return

        const data = await partnerCollectorProfileLoader({
          partnerId,
          userId: collectorId,
        })

        return {
          ...data.collector_profile,
          follows_profile: data.follows_profile,
        }
      },
    },
  }),
})
