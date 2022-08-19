import { GraphQLBoolean, GraphQLString, GraphQLList } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { snakeCase } from "lodash"
import { CollectorProfileFields } from "../collectorProfile"
import { IntentsType } from "../types/IntentsType"
import { omit } from "lodash"

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "UpdateCollectorProfileWithID",
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
    companyName: { type: GraphQLString },
    companyWebsite: { type: GraphQLString },
    confirmedBuyer: { type: GraphQLBoolean },
    id: {
      description: "The internal ID of the collector profile to update",
      type: GraphQLString,
    },
    institutionalAffiliations: { type: GraphQLString },
    intents: { type: new GraphQLList(IntentsType) },
    loyaltyApplicant: { type: GraphQLBoolean },
    professionalBuyer: { type: GraphQLBoolean },
    selfReportedPurchases: {
      description: "Free-form text of purchases the collector has indicated.",
      type: GraphQLString,
    },
  },
  outputFields: CollectorProfileFields,
  mutateAndGetPayload: (args, { updateCollectorProfileLoader }) => {
    // snake_case keys for Gravity (keys are the same otherwise)
    const options = Object.keys(args).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
      {}
    )

    if (!updateCollectorProfileLoader) {
      throw new Error(
        "Missing Update Collector Profile Loader. Check your access token."
      )
    }

    return updateCollectorProfileLoader(args.id, omit(options, "id"))
  },
})
