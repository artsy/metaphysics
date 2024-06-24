import { GraphQLBoolean, GraphQLString, GraphQLList } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { snakeCase } from "lodash"
import { CollectorProfileFields } from "../CollectorProfile/collectorProfile"
import { IntentsType } from "../CollectorProfile/types/IntentsType"

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "UpdateCollectorProfile",
  description: "Updating a collector profile (loyalty applicant status).",
  inputFields: {
    affiliatedAuctionHouseIds: {
      description: "List of affiliated auction house ids, referencing Galaxy.",
      type: new GraphQLList(GraphQLString),
    },
    affiliatedFairIds: {
      description: "List of affiliated fair ids, referencing Galaxy.",
      type: new GraphQLList(GraphQLString),
    },
    affiliatedGalleryIds: {
      description: "List of affiliated gallery ids, referencing Galaxy.",
      type: new GraphQLList(GraphQLString),
    },
    institutionalAffiliations: { type: GraphQLString },
    companyName: { type: GraphQLString },
    companyWebsite: { type: GraphQLString },
    intents: { type: new GraphQLList(IntentsType) },
    loyaltyApplicant: { type: GraphQLBoolean },
    professionalBuyer: { type: GraphQLBoolean },
    promptedForUpdate: {
      type: GraphQLBoolean,
      description:
        "Since we don't want to ask a collector to update their profile too often, set this to record they've been prompted",
    },
    selfReportedPurchases: {
      description: "Free-form text of purchases the collector has indicated.",
      type: GraphQLString,
    },
  },
  outputFields: CollectorProfileFields,
  mutateAndGetPayload: (args, { meUpdateCollectorProfileLoader }) => {
    // snake_case keys for Gravity (keys are the same otherwise)
    const options = Object.keys(args).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
      {}
    )

    if (!meUpdateCollectorProfileLoader) {
      throw new Error(
        "Missing Update Collector Profile Loader. Check your access token."
      )
    }

    return meUpdateCollectorProfileLoader(options)
  },
})
